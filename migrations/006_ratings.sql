-- Migration 006: Ratings and feedback system
-- Run in Neon SQL Editor

CREATE TABLE IF NOT EXISTS ratings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id     UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  rater_user_id  TEXT NOT NULL,
  ratee_user_id  TEXT NOT NULL,
  ratee_type     TEXT NOT NULL CHECK (ratee_type IN ('brand', 'superstar')),
  score          INT  NOT NULL CHECK (score >= 1 AND score <= 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (inquiry_id, rater_user_id)   -- one rating per participant per booking
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee   ON ratings(ratee_user_id, ratee_type);
CREATE INDEX IF NOT EXISTS idx_ratings_inquiry ON ratings(inquiry_id);
