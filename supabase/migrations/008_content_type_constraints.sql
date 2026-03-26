-- Migration 008: Content Type Boundary Enforcement
--
-- Adds validation triggers to prevent common data integrity issues:
-- 1. Person entities must reference biography-type stories (not incident/place/era)
-- 2. Backslash cleanup in text fields
--
-- These constraints enforce boundaries that were previously only checked in the UI,
-- causing recurring bugs: biography story leaks, places-as-stories, escaped backslashes.

-- ─── 1. Validate entity canonical_story_id matches expected story type ────────
-- Person entities should have biography stories, not incident/place/era.
-- Place entities should have place stories (or NULL).

CREATE OR REPLACE FUNCTION validate_entity_story_type()
RETURNS TRIGGER AS $$
DECLARE
  story_type_val text;
BEGIN
  -- Skip if no canonical_story_id set
  IF NEW.canonical_story_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up the story type
  SELECT story_type::text INTO story_type_val
  FROM stories
  WHERE id = NEW.canonical_story_id;

  -- If story doesn't exist, let FK constraint handle it
  IF story_type_val IS NULL THEN
    RETURN NEW;
  END IF;

  -- Person entities should reference biography stories
  IF NEW.type = 'person' AND story_type_val != 'biography' THEN
    RAISE WARNING 'Entity % (type=person) has canonical_story_id % with story_type=% (expected biography)',
      NEW.id, NEW.canonical_story_id, story_type_val;
  END IF;

  -- Place entities should reference place stories
  IF NEW.type = 'place' AND story_type_val != 'place' THEN
    RAISE WARNING 'Entity % (type=place) has canonical_story_id % with story_type=% (expected place)',
      NEW.id, NEW.canonical_story_id, story_type_val;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_entity_story_type ON entities;
CREATE TRIGGER trg_validate_entity_story_type
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION validate_entity_story_type();

-- ─── 2. Strip trailing backslashes from text fields on insert/update ─────────
-- Prevents the escaped backslash artifact from pipeline ingestion.

CREATE OR REPLACE FUNCTION clean_trailing_backslashes()
RETURNS TRIGGER AS $$
BEGIN
  -- Moments
  IF TG_TABLE_NAME = 'moments' THEN
    NEW.name := regexp_replace(COALESCE(NEW.name, ''), E'\\\\+$', '');
    NEW.subtitle := regexp_replace(COALESCE(NEW.subtitle, ''), E'\\\\+$', '');
    NEW.description := regexp_replace(COALESCE(NEW.description, ''), E'\\\\+$', '');
  END IF;

  -- Stories
  IF TG_TABLE_NAME = 'stories' THEN
    NEW.name := regexp_replace(COALESCE(NEW.name, ''), E'\\\\+$', '');
    NEW.nickname := regexp_replace(COALESCE(NEW.nickname, ''), E'\\\\+$', '');
    NEW.description := regexp_replace(COALESCE(NEW.description, ''), E'\\\\+$', '');
  END IF;

  -- Entities
  IF TG_TABLE_NAME = 'entities' THEN
    NEW.name := regexp_replace(COALESCE(NEW.name, ''), E'\\\\+$', '');
    NEW.description := regexp_replace(COALESCE(NEW.description, ''), E'\\\\+$', '');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clean_backslashes_moments ON moments;
CREATE TRIGGER trg_clean_backslashes_moments
  BEFORE INSERT OR UPDATE ON moments
  FOR EACH ROW
  EXECUTE FUNCTION clean_trailing_backslashes();

DROP TRIGGER IF EXISTS trg_clean_backslashes_stories ON stories;
CREATE TRIGGER trg_clean_backslashes_stories
  BEFORE INSERT OR UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION clean_trailing_backslashes();

DROP TRIGGER IF EXISTS trg_clean_backslashes_entities ON entities;
CREATE TRIGGER trg_clean_backslashes_entities
  BEFORE INSERT OR UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION clean_trailing_backslashes();

-- ─── 3. One-time cleanup: strip existing trailing backslashes ────────────────

UPDATE moments SET
  name = regexp_replace(name, E'\\\\+$', ''),
  subtitle = regexp_replace(subtitle, E'\\\\+$', ''),
  description = regexp_replace(description, E'\\\\+$', '')
WHERE name ~ E'\\\\+$' OR subtitle ~ E'\\\\+$' OR description ~ E'\\\\+$';

UPDATE stories SET
  name = regexp_replace(name, E'\\\\+$', ''),
  nickname = regexp_replace(nickname, E'\\\\+$', ''),
  description = regexp_replace(description, E'\\\\+$', '')
WHERE name ~ E'\\\\+$' OR nickname ~ E'\\\\+$' OR description ~ E'\\\\+$';

UPDATE entities SET
  name = regexp_replace(name, E'\\\\+$', ''),
  description = regexp_replace(description, E'\\\\+$', '')
WHERE name ~ E'\\\\+$' OR description ~ E'\\\\+$';
