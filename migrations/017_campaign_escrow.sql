-- 017_campaign_escrow.sql
-- Adds amount_sgd to inquiries so brands can specify cash payment when sending an offer.
-- Adds payment_status + escrow tracking columns to campaigns.

ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS amount_sgd DECIMAL(10,2);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'not_required';
-- payment_status values:
--   not_required  - product/hourly remuneration, no payment needed
--   pending       - cash remuneration, payment not yet made
--   held          - brand paid, funds held on platform
--   released      - admin released funds to talent
--   refunded      - payment was refunded to brand
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMPTZ;
