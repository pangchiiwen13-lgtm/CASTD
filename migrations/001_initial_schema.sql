-- Northstar talent marketplace schema
-- Run via Neon console SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands (corporate / agency accounts)
CREATE TABLE brands (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT UNIQUE NOT NULL,  -- from Neon Auth / Stack Auth
  company_name TEXT NOT NULL,
  industry     TEXT,
  brand_values TEXT[] DEFAULT '{}',
  aesthetic_tags TEXT[] DEFAULT '{}',
  target_audience JSONB DEFAULT '{}',
  campaign_type TEXT,
  plan_tier    TEXT NOT NULL DEFAULT 'free',  -- free | subscriber
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Talents (managed via admin panel)
CREATE TABLE talents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ig_username         TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  age                 INT,
  gender              TEXT,
  languages           TEXT[] DEFAULT '{}',
  content_types       TEXT[] DEFAULT '{}',
  vibe_tags           TEXT[] DEFAULT '{}',
  ig_handle           TEXT,
  tiktok_handle       TEXT,
  ig_followers        INT DEFAULT 0,
  tiktok_followers    INT DEFAULT 0,
  bio                 TEXT,
  experience_summary  TEXT,
  rate_card_text      TEXT,
  photo_urls          TEXT[] DEFAULT '{}',
  intro_video_url     TEXT,
  face_condition      TEXT,
  hair_condition      TEXT,
  body_condition      TEXT,
  tc_signed           BOOLEAN DEFAULT FALSE,
  is_published        BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shortlists (brands save talents)
CREATE TABLE shortlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id   UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  talent_id  UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, talent_id)
);

-- Inquiries (free to submit)
CREATE TABLE inquiries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  talent_id       UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  campaign_name   TEXT NOT NULL,
  campaign_type   TEXT,
  brief_text      TEXT,
  budget_range    TEXT,
  preferred_dates TEXT,
  status          TEXT NOT NULL DEFAULT 'open',  -- open | reviewing | confirmed | closed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact confirmations (payment triggered here)
CREATE TABLE contact_confirmations (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id           UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  talent_id          UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  inquiry_id         UUID REFERENCES inquiries(id) ON DELETE SET NULL,
  stripe_session_id  TEXT UNIQUE,
  amount_sgd         NUMERIC(10,2),
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions ($15/month plan)
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id                UUID NOT NULL UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE NOT NULL,
  stripe_customer_id      TEXT,
  plan                    TEXT NOT NULL DEFAULT 'monthly_15',
  status                  TEXT NOT NULL DEFAULT 'active',  -- active | cancelled | past_due
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI brand-fit scores (cached)
CREATE TABLE brand_fit_scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  talent_id   UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  score       INT NOT NULL CHECK (score >= 0 AND score <= 100),
  rationale   TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, talent_id)
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER talents_updated_at BEFORE UPDATE ON talents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
