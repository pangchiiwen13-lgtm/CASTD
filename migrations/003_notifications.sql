-- Migration 003: notifications, platform_settings, talent email
-- Run via Neon console SQL editor

-- Platform-wide key/value settings (admin-managed)
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default key so the admin settings page can always read it
INSERT INTO platform_settings (key, value) VALUES
  ('resend_api_key', '')
ON CONFLICT (key) DO NOTHING;

-- In-app notifications for brand users
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,          -- brand's auth user_id
  type       TEXT NOT NULL,          -- inquiry_submitted | inquiry_reviewing | inquiry_confirmed | inquiry_closed
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  link       TEXT,                   -- optional route to navigate to on click
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- Add email to talents so we can notify them
ALTER TABLE talents ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email to brands so we can notify them when admin changes their inquiry status
ALTER TABLE brands ADD COLUMN IF NOT EXISTS email TEXT;
