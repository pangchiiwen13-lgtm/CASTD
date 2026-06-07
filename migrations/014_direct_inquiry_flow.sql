-- Migration 014: Direct inquiry flow (no admin approval)
-- Brands send offers directly to superstars; superstars accept or decline.
-- Superstars can also apply to brand's open campaigns; brands accept or decline.

-- Remove old status CHECK constraint so we can use new values
ALTER TABLE inquiries DROP CONSTRAINT IF EXISTS inquiries_status_check;

-- New columns
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'brand_to_superstar';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS initiator_user_id TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Migrate existing status values to new flow
UPDATE inquiries SET status = 'accepted'  WHERE status = 'confirmed';
UPDATE inquiries SET status = 'pending'   WHERE status IN ('open', 'reviewing');
UPDATE inquiries SET status = 'cancelled' WHERE status = 'closed';

-- Ensure direction is set on legacy rows
UPDATE inquiries SET direction = 'brand_to_superstar' WHERE direction IS NULL OR direction = '';

-- Brand projects: flag to allow superstar applications
ALTER TABLE brand_projects ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_inquiries_direction   ON inquiries(direction);
CREATE INDEX IF NOT EXISTS idx_inquiries_talent_dir  ON inquiries(talent_id, direction);
CREATE INDEX IF NOT EXISTS idx_inquiries_brand_dir   ON inquiries(brand_id, direction);
