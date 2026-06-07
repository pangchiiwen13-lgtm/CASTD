-- Weekly availability schedule for talents
-- Talents set recurring hours per day-of-week (0=Sun...6=Sat)
-- Brands see the schedule as colored calendar days with hover time slots

CREATE TABLE IF NOT EXISTS talent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES talents(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  UNIQUE (talent_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_talent_availability ON talent_availability(talent_id);
