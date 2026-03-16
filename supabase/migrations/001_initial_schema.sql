-- Deep Maps — Initial Schema
-- Phase 0: Tables, enums, indexes, grants
-- Run via Supabase SQL Editor or psql

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- Enums (fixed-set categories)
-- ============================================================
CREATE TYPE story_category AS ENUM (
  'dark-history', 'battles-conflicts', 'discovery-science',
  'arts-culture', 'mystery-unexplained', 'political-drama',
  'everyday-extraordinary', 'sacred-history'
);

CREATE TYPE location_importance AS ENUM ('major', 'minor', 'contextual');
CREATE TYPE location_accuracy AS ENUM ('exact', 'approximate', 'general-area');
CREATE TYPE story_type AS ENUM ('incident', 'biography', 'place', 'era');
CREATE TYPE moment_kind AS ENUM ('event', 'milestone', 'presence');
CREATE TYPE verification_level AS ENUM ('verified', 'documented', 'traditional', 'legendary');
CREATE TYPE entity_type AS ENUM ('person', 'place', 'organization', 'concept');
CREATE TYPE media_type AS ENUM ('image', 'youtube');
CREATE TYPE link_type AS ENUM ('affiliate', 'wiki', 'source', 'tour', 'stay');

-- ============================================================
-- Reference table: moment types (grows over time — not an enum)
-- Consolidations: natural_feature → natural_site, home/historic_home → residence
-- ============================================================
CREATE TABLE moment_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO moment_types (id, label) VALUES
  ('archaeological_site', 'Archaeological Site'),
  ('art_installation', 'Art Installation'),
  ('battlefield', 'Battlefield'),
  ('biblical_event', 'Biblical Event'),
  ('burial', 'Burial'),
  ('crash_site', 'Crash Site'),
  ('crime_scene', 'Crime Scene'),
  ('cultural_site', 'Cultural Site'),
  ('cultural_venue', 'Cultural Venue'),
  ('disaster', 'Disaster'),
  ('discovery_site', 'Discovery Site'),
  ('government', 'Government'),
  ('haunted_site', 'Haunted Site'),
  ('historic_meeting', 'Historic Meeting'),
  ('historical_site', 'Historical Site'),
  ('industrial_site', 'Industrial Site'),
  ('institution', 'Institution'),
  ('landmark', 'Landmark'),
  ('military_site', 'Military Site'),
  ('monument', 'Monument'),
  ('natural_site', 'Natural Site'),
  ('organization_hq', 'Organization HQ'),
  ('political_event', 'Political Event'),
  ('religious_site', 'Religious Site'),
  ('residence', 'Residence'),
  ('settlement_site', 'Settlement Site'),
  ('university', 'University'),
  ('workplace', 'Workplace');

-- ============================================================
-- Core tables
-- ============================================================

CREATE TABLE moments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  type_id TEXT NOT NULL REFERENCES moment_types(id),
  importance location_importance NOT NULL,
  notability SMALLINT NOT NULL DEFAULT 30 CHECK (notability BETWEEN 0 AND 100),
  accuracy location_accuracy NOT NULL,
  kind moment_kind NOT NULL DEFAULT 'event',
  year INTEGER,
  date TEXT,
  address TEXT,
  verification_level verification_level NOT NULL DEFAULT 'verified',
  wiki_section TEXT,
  source TEXT DEFAULT 'editorial',
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  years TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  category story_category NOT NULL,
  story_type story_type NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  content_warning TEXT,
  wikipedia_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type entity_type NOT NULL,
  years TEXT,
  description TEXT,
  canonical_story_id TEXT REFERENCES stories(id),
  wikipedia_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Join tables
-- ============================================================

CREATE TABLE story_moments (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  narrative_glue TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (story_id, moment_id)
);

CREATE TABLE collection_moments (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, moment_id)
);

CREATE TABLE moment_entities (
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY (moment_id, entity_id)
);

CREATE TABLE related_stories (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  related_story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, related_story_id),
  CHECK (story_id != related_story_id)
);

-- Future tables (create empty — populated during migration)
CREATE TABLE moment_media (
  id SERIAL PRIMARY KEY,
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE moment_links (
  id SERIAL PRIMARY KEY,
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  type link_type NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

-- ============================================================
-- Indexes
-- ============================================================

-- Hot path: viewport bounding-box queries
CREATE INDEX idx_moments_location ON moments USING GIST (location);

-- Partial index for zoomed-out views (S/A-tier only)
CREATE INDEX idx_moments_location_notable ON moments USING GIST (location)
  WHERE notability >= 65;

-- Notability filtering
CREATE INDEX idx_moments_notability ON moments (notability DESC);

-- Story ↔ moment (both directions)
CREATE INDEX idx_story_moments_story ON story_moments (story_id, sort_order);
CREATE INDEX idx_story_moments_moment ON story_moments (moment_id);

-- Moment ↔ entity (both directions)
CREATE INDEX idx_moment_entities_moment ON moment_entities (moment_id);
CREATE INDEX idx_moment_entities_entity ON moment_entities (entity_id);

-- Collection ↔ moment (both directions)
CREATE INDEX idx_collection_moments_collection ON collection_moments (collection_id, sort_order);
CREATE INDEX idx_collection_moments_moment ON collection_moments (moment_id);

-- Category + year filtering
CREATE INDEX idx_stories_category ON stories (category);
CREATE INDEX idx_moments_year ON moments (year) WHERE year IS NOT NULL;
CREATE INDEX idx_stories_start_year ON stories (start_year) WHERE start_year IS NOT NULL;

-- Entity canonical story
CREATE INDEX idx_entities_canonical ON entities (canonical_story_id)
  WHERE canonical_story_id IS NOT NULL;

-- Media + links by moment
CREATE INDEX idx_moment_media_moment ON moment_media (moment_id, sort_order);
CREATE INDEX idx_moment_links_moment ON moment_links (moment_id, sort_order);

-- Future text search (trigram)
CREATE INDEX idx_moments_name_trgm ON moments USING GIN (name gin_trgm_ops);
CREATE INDEX idx_stories_name_trgm ON stories USING GIN (name gin_trgm_ops);
CREATE INDEX idx_entities_name_trgm ON entities USING GIN (name gin_trgm_ops);

-- Source tracking (for ingestion pipeline)
CREATE INDEX idx_moments_source ON moments (source) WHERE source IS NOT NULL;

-- ============================================================
-- Security: public read, service_role write
-- No RLS — simpler and 10-15% faster for public read-only
-- ============================================================

-- Grant read-only to anon (the public API key role)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Revoke write from anon
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- service_role has full access by default (used in ingestion scripts)

-- ============================================================
-- Updated_at trigger (auto-update on row changes)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_moments_updated_at
  BEFORE UPDATE ON moments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_entities_updated_at
  BEFORE UPDATE ON entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
