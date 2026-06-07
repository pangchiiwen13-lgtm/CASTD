-- Migration 009: Chat messages between brand and superstar per campaign
-- Run in Neon SQL editor

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_user_id TEXT NOT NULL,
  sender_type  TEXT NOT NULL CHECK (sender_type IN ('brand', 'superstar')),
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_campaign_id   ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_time ON messages(campaign_id, created_at);
