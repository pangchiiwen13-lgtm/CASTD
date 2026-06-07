-- Migration 013: Brand Projects
-- Brands create campaign containers first, then hire superstars within them.
-- project_id is added to both inquiries and campaigns (nullable for backwards compat).

CREATE TABLE IF NOT EXISTS brand_projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  campaign_type TEXT,
  brief_text    TEXT,
  deliverables  TEXT,
  shoot_date    TEXT,
  budget_range  TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES brand_projects(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES brand_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_brand_projects_brand_id ON brand_projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_project_id    ON inquiries(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id    ON campaigns(project_id);
