-- Migration 008: Add remuneration fields to inquiries
-- Run in Neon SQL editor

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS remuneration_type TEXT DEFAULT 'product'
    CHECK (remuneration_type IN ('product', 'cash')),
  ADD COLUMN IF NOT EXISTS product_description TEXT;
