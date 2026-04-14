-- Add sources column to moments table
-- Stores citation strings as a text array (e.g., journal refs, archival sources)
ALTER TABLE moments ADD COLUMN IF NOT EXISTS sources TEXT[];
