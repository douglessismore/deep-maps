-- Geo verification columns on moments table
ALTER TABLE moments ADD COLUMN IF NOT EXISTS geo_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS geo_source_url TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS geo_verified_at TIMESTAMPTZ;

-- Index for fast unverified filtering
CREATE INDEX IF NOT EXISTS idx_moments_geo_unverified ON moments (geo_verified) WHERE geo_verified = false;

-- RPC for updating moment location (avoids PostgREST geometry ambiguity)
CREATE OR REPLACE FUNCTION update_moment_location(
  p_id TEXT,
  p_lng FLOAT8,
  p_lat FLOAT8,
  p_source_url TEXT DEFAULT NULL
) RETURNS VOID AS $$
  UPDATE moments SET
    location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    geo_verified = true,
    geo_source_url = p_source_url,
    geo_verified_at = NOW(),
    updated_at = NOW()
  WHERE id = p_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant execute to anon role
GRANT EXECUTE ON FUNCTION update_moment_location TO anon;
