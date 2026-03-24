-- Tracker notes: brain-dump ideas and per-person notes
-- Used by the interactive tracker.html for live note-taking

CREATE TABLE IF NOT EXISTS tracker_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_slug TEXT,  -- NULL = global idea, non-null = linked to a specific person
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('idea', 'note', 'todo')),
  text TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast per-person lookups
CREATE INDEX IF NOT EXISTS idx_tracker_notes_person ON tracker_notes(person_slug) WHERE person_slug IS NOT NULL;

-- Index for unresolved items
CREATE INDEX IF NOT EXISTS idx_tracker_notes_unresolved ON tracker_notes(resolved) WHERE resolved = false;

-- Allow anon role to read and write (personal development tool, not public-facing)
GRANT SELECT, INSERT, UPDATE, DELETE ON tracker_notes TO anon;
