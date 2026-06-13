-- Migration 007: Campaigns table
-- A campaign is created when an inquiry is confirmed.
-- It tracks the full lifecycle: active -> delivered -> completed (or cancelled).

CREATE TABLE IF NOT EXISTS campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id          UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  brand_id            UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  talent_id           UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,

  -- Campaign brief (copied from inquiry at creation, editable by admin)
  campaign_name       TEXT NOT NULL,
  campaign_type       TEXT,
  brief_text          TEXT,
  deliverables        TEXT,          -- what the talent must produce/submit
  shoot_date          TEXT,
  remuneration_type   TEXT DEFAULT 'product',  -- 'cash', 'product', 'hybrid'
  amount_sgd          INT,           -- in cents if cash component

  -- Status flow: active -> delivered -> completed | cancelled
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'delivered', 'completed', 'cancelled')),

  -- Talent side: marks as delivered
  talent_delivered_at TIMESTAMPTZ,
  deliverable_urls    TEXT[] DEFAULT '{}',
  deliverable_note    TEXT,

  -- Brand side: confirms delivery
  brand_confirmed_at  TIMESTAMPTZ,
  auto_release_at     TIMESTAMPTZ,  -- set to 14 days after talent_delivered_at

  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id   ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_talent_id  ON campaigns(talent_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status     ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_inquiry_id ON campaigns(inquiry_id);
