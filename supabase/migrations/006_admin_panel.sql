-- Migration 006: Admin Panel Support
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Admin Ratings (user calibration of notability)
CREATE TABLE IF NOT EXISTS admin_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('story','entity','moment','collection')),
  item_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (item_type, item_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_ratings_item ON admin_ratings (item_type, item_id);

-- 2. Admin Notes (field-level notes on any item)
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('story','entity','moment','collection')),
  item_id TEXT NOT NULL,
  field_name TEXT,
  text TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_notes_item ON admin_notes (item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_unresolved ON admin_notes (resolved) WHERE resolved = false;

-- 3. Roadmap Items (interactive board)
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in-progress','done')),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_status ON roadmap_items (status);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_category ON roadmap_items (category, sort_order);

-- 4. Review status columns on content tables
ALTER TABLE moments ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'unreviewed';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'unreviewed';
ALTER TABLE entities ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'unreviewed';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'unreviewed';

-- 5. Grants for anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON roadmap_items TO anon;
GRANT UPDATE ON moments TO anon;
GRANT UPDATE ON stories TO anon;
GRANT UPDATE ON entities TO anon;
GRANT UPDATE ON collections TO anon;
GRANT INSERT, DELETE ON moment_entities TO anon;
GRANT INSERT, DELETE ON story_moments TO anon;
