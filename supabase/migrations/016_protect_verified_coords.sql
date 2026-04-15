-- Database-level protection: prevent overwriting geo-verified coordinates
-- If a moment has geo_verified=true, any UPDATE that changes the location column
-- must also explicitly include geo_verified in the payload (via the RPC function).
-- This catches any script or query that blindly overwrites coords.

CREATE OR REPLACE FUNCTION protect_verified_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only protect if the row was previously verified
  IF OLD.geo_verified = true
     AND NEW.location IS DISTINCT FROM OLD.location
     AND NEW.geo_verified_at IS NOT DISTINCT FROM OLD.geo_verified_at
  THEN
    -- The location is changing but geo_verified_at is NOT being updated,
    -- meaning this is NOT coming from the admin verification RPC.
    -- Silently preserve the old location instead of erroring.
    NEW.location := OLD.location;
    RAISE NOTICE 'Protected geo-verified coords for moment %', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_verified_location_trigger ON moments;
CREATE TRIGGER protect_verified_location_trigger
  BEFORE UPDATE ON moments
  FOR EACH ROW
  EXECUTE FUNCTION protect_verified_location();
