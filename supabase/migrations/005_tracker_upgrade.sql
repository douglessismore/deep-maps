-- Upgrade tracker_notes for multi-entity-type support and idea categories
-- Renames person_slug → entity_slug so notes can attach to any entity type
-- Adds category column for classifying brain-dump ideas

-- 1. Rename person_slug → entity_slug
ALTER TABLE tracker_notes RENAME COLUMN person_slug TO entity_slug;

-- 2. Add category column for idea classification
ALTER TABLE tracker_notes ADD COLUMN category TEXT DEFAULT 'general';

-- 3. Rebuild indexes with new column name
DROP INDEX IF EXISTS idx_tracker_notes_person;
CREATE INDEX idx_tracker_notes_entity ON tracker_notes(entity_slug) WHERE entity_slug IS NOT NULL;
CREATE INDEX idx_tracker_notes_category ON tracker_notes(category);
