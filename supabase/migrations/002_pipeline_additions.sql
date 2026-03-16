-- Migration 002: AI Content Pipeline Support
-- Adds: work entity type, ingestion tracking, review queue

-- 1. Add 'work' to entity_type enum
-- Covers films, books, journals, religious texts, scientific papers, explorer logs, etc.
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'work';

-- 2. Ingestion run tracking (audit trail for each pipeline run)
CREATE TABLE ingestion_runs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,              -- 'notable-people', 'unesco', 'nrhp', etc.
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  config JSONB,                      -- selection criteria, thresholds, limits
  stats JSONB,                       -- { moments_created, stories_created, entities_created, ... }
  status TEXT NOT NULL DEFAULT 'running'  -- running | completed | failed
);

-- 3. Review queue for human-in-the-loop content review
CREATE TABLE review_queue (
  id SERIAL PRIMARY KEY,
  ingestion_run_id INTEGER REFERENCES ingestion_runs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,           -- 'moment', 'story', 'entity', 'collection'
  item_id TEXT,                      -- proposed ID for the item
  draft_data JSONB NOT NULL,         -- full object ready to insert after approval
  related_items JSONB,               -- { story_moments: [...], moment_entities: [...], etc. }
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected | edited
  reviewer_notes TEXT,
  validation_errors JSONB,           -- automated content guide violations
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_review_queue_status ON review_queue (status) WHERE status = 'pending';
CREATE INDEX idx_review_queue_run ON review_queue (ingestion_run_id);

-- 4. Grant read access to anon (consistent with existing security model)
GRANT SELECT ON ingestion_runs TO anon;
GRANT SELECT ON review_queue TO anon;
-- service_role has full access by default (used in pipeline scripts)

COMMENT ON TABLE ingestion_runs IS 'Tracks each AI content pipeline execution for auditing';
COMMENT ON TABLE review_queue IS 'Human review queue for AI-drafted content before publishing';
