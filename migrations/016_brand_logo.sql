-- Migration 016: Brand logo URL
-- Brands can add their logo to appear in the "trusted brands" slider on the landing page.

ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
