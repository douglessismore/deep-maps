-- Fix: update_moment_location RPC now accepts and persists accuracy level.
-- Previously, admin edits set geo_verified=true but left accuracy unchanged.

CREATE OR REPLACE FUNCTION update_moment_location(
  p_id TEXT,
  p_lng FLOAT8,
  p_lat FLOAT8,
  p_source_url TEXT DEFAULT NULL,
  p_accuracy TEXT DEFAULT NULL
) RETURNS VOID AS $$
  UPDATE moments SET
    location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    geo_verified = true,
    geo_source_url = p_source_url,
    geo_verified_at = NOW(),
    updated_at = NOW(),
    accuracy = COALESCE(p_accuracy, accuracy)
  WHERE id = p_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Re-grant (needed after CREATE OR REPLACE)
GRANT EXECUTE ON FUNCTION update_moment_location TO anon;
