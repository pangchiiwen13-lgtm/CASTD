-- Migration 010: Talent availability calendar (blocked dates)
-- Run in Neon SQL editor

CREATE TABLE IF NOT EXISTS talent_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id  UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  UNIQUE (talent_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_talent_blocks_talent ON talent_blocks(talent_id);
