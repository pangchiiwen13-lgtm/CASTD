-- Migration 005: Superstar self-serve portal
-- Run in Neon SQL Editor

-- Add self-serve columns to talents
ALTER TABLE talents
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS profile_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS remuneration_preference TEXT DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS min_rate_sgd INT,
  ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- One talent profile per auth user (partial unique index — ignores NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_talents_user_id
  ON talents(user_id) WHERE user_id IS NOT NULL;
