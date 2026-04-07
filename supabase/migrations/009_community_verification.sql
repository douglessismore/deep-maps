-- Community Location Verification
-- Adds user profiles, location suggestions, votes, and comments
-- for crowdsourced location accuracy verification.

-- ═══════════════════════════════════════════════════════════════
-- 1. User profiles (auto-created on auth signup)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_suggestions INTEGER DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  pinpoint_count INTEGER DEFAULT 0,
  exact_count INTEGER DEFAULT 0
);

-- Auto-create profile on signup
-- NOTE: SET search_path = public is critical — without it, SECURITY DEFINER
-- functions can't resolve unqualified table names from auth schema context.
-- EXCEPTION handler ensures signup never fails even if profile creation does.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'User' END
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- 2. Location suggestions
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS location_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_level TEXT NOT NULL CHECK (accuracy_level IN ('pinpoint', 'exact', 'approximate', 'general-area')),
  explanation TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_description TEXT,
  parent_suggestion_id UUID REFERENCES location_suggestions(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'superseded')),
  verified_at TIMESTAMPTZ,
  agree_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_suggestions_moment ON location_suggestions(moment_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON location_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON location_suggestions(status);

-- ═══════════════════════════════════════════════════════════════
-- 3. Suggestion votes (agree/disagree)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES location_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(suggestion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_suggestion ON suggestion_votes(suggestion_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. Suggestion comments (discussion)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS suggestion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES location_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_suggestion ON suggestion_comments(suggestion_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. Verification trigger — auto-verify on 1+ agree votes
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agree_total INTEGER;
  suggestion RECORD;
BEGIN
  IF NEW.vote_type = 'agree' THEN
    -- Count agrees for this suggestion
    SELECT COUNT(*) INTO agree_total
    FROM suggestion_votes
    WHERE suggestion_id = NEW.suggestion_id AND vote_type = 'agree';

    -- Update agree_count
    UPDATE location_suggestions
    SET agree_count = agree_total
    WHERE id = NEW.suggestion_id;

    -- 1 agree = verified (MVP threshold)
    IF agree_total >= 1 THEN
      -- Mark suggestion as verified
      UPDATE location_suggestions
      SET status = 'verified', verified_at = NOW()
      WHERE id = NEW.suggestion_id AND status = 'pending'
      RETURNING * INTO suggestion;

      -- If verification happened, update moment's canonical location
      IF FOUND THEN
        -- Use ST_MakePoint for PostGIS location column (not lat/lng)
        UPDATE moments
        SET location = ST_SetSRID(ST_MakePoint(suggestion.lng, suggestion.lat), 4326),
            accuracy = suggestion.accuracy_level,
            geo_verified = true,
            geo_source_url = suggestion.source_url,
            geo_verified_at = NOW()
        WHERE id = suggestion.moment_id;

        -- Update user stats
        UPDATE user_profiles
        SET total_suggestions = total_suggestions + 1
        WHERE id = suggestion.user_id;

        -- Increment accuracy-specific count
        IF suggestion.accuracy_level = 'pinpoint' THEN
          UPDATE user_profiles SET pinpoint_count = pinpoint_count + 1 WHERE id = suggestion.user_id;
        ELSIF suggestion.accuracy_level = 'exact' THEN
          UPDATE user_profiles SET exact_count = exact_count + 1 WHERE id = suggestion.user_id;
        END IF;

        -- Credit the voter as a verifier
        UPDATE user_profiles
        SET total_verifications = total_verifications + 1
        WHERE id = NEW.user_id;

        -- Mark other pending suggestions for same moment as superseded
        UPDATE location_suggestions
        SET status = 'superseded'
        WHERE moment_id = suggestion.moment_id
          AND id != suggestion.id
          AND status = 'pending';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_vote_cast ON suggestion_votes;
CREATE TRIGGER on_vote_cast
  AFTER INSERT ON suggestion_votes
  FOR EACH ROW EXECUTE FUNCTION check_verification();

-- ═══════════════════════════════════════════════════════════════
-- 6. Row Level Security
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Public read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Public read suggestions" ON location_suggestions FOR SELECT USING (true);
CREATE POLICY "Public read votes" ON suggestion_votes FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON suggestion_comments FOR SELECT USING (true);

-- Authenticated users can insert their own
CREATE POLICY "Insert own suggestions" ON location_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Insert own votes" ON suggestion_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Insert own comments" ON suggestion_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
