-- Migration 015: Per-campaign talent criteria + campaign-level fit scores
-- Brands define who they are looking for per campaign.
-- DeepSeek scores each talent against the specific campaign criteria.

-- Talent criteria on brand_projects
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_content_types TEXT[] DEFAULT '{}';
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_languages      TEXT[] DEFAULT '{}';
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_gender         TEXT;
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_age_min        INT;
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_age_max        INT;
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_vibe_tags      TEXT[] DEFAULT '{}';
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS target_min_followers  INT;

-- Per-campaign fit scores (replaces brand-level scoring for catalog browsing)
CREATE TABLE IF NOT EXISTS campaign_fit_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES brand_projects(id) ON DELETE CASCADE,
  talent_id   UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  score       INT  NOT NULL CHECK (score >= 0 AND score <= 100),
  rationale   TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, talent_id)
);

CREATE INDEX IF NOT EXISTS idx_cfs_project ON campaign_fit_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_cfs_talent  ON campaign_fit_scores(talent_id, project_id);
