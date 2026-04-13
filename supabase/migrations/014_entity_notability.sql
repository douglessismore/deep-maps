-- Add notability column to entities table.
-- Matches the static Entity.notability field (0-100 score for browse visibility).
ALTER TABLE entities ADD COLUMN IF NOT EXISTS notability SMALLINT;
