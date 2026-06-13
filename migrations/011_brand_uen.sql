-- Migration 011: Brand UEN (Singapore Unique Entity Number) for compliance
-- Run in Neon SQL editor

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS uen              TEXT,
  ADD COLUMN IF NOT EXISTS uen_verified     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS uen_verified_name TEXT,
  ADD COLUMN IF NOT EXISTS uen_status       TEXT DEFAULT 'unverified'
    CHECK (uen_status IN ('unverified', 'pending_review', 'verified', 'rejected'));
