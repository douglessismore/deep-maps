-- Extend tracker_notes to support audit gate tracking
-- Gates 7 (encyclopedic tone) and 8 (cultural sensitivity) are manual reviews
-- tracked via note_type = 'audit-tone' and 'audit-sensitivity'

ALTER TABLE tracker_notes DROP CONSTRAINT IF EXISTS tracker_notes_note_type_check;
ALTER TABLE tracker_notes ADD CONSTRAINT tracker_notes_note_type_check
  CHECK (note_type IN ('idea', 'note', 'todo', 'audit-tone', 'audit-sensitivity'));
