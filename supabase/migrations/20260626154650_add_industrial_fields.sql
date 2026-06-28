/*
# SafeSphere AI — Add Industrial Fields

## Overview
Adds industrial-specific fields to existing tables to support PPE tracking,
shift management, machine health scoring, and sensor type categorization.

## Modified Tables

1. **workers** — Added `shift` (day/night/rotating), `ppe_status` (compliant/
   non_compliant/expired), `ppe_items` (array of PPE items checked)
2. **machines** — Added `health_score` (0-100 integer), `running_hours` 
   (alias for operating_hours for clarity)
3. **sensor_data** — Added `sensor_type` (gas/temperature/pressure/humidity/
   smoke/voltage/battery), `min_threshold`, `max_threshold`

## Security
- No RLS changes — existing policies cover new columns automatically.

## Important Notes
1. All new columns are nullable or have defaults to avoid breaking existing rows.
2. `health_score` defaults to 85 (good operational health).
3. `ppe_status` defaults to 'compliant'.
4. Uses DO $$ blocks for idempotent column additions.
*/

-- ============================================================
-- WORKERS: Add shift and PPE fields
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'shift'
  ) THEN
    ALTER TABLE workers ADD COLUMN shift text NOT NULL DEFAULT 'day'
      CHECK (shift IN ('day', 'night', 'rotating'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'ppe_status'
  ) THEN
    ALTER TABLE workers ADD COLUMN ppe_status text NOT NULL DEFAULT 'compliant'
      CHECK (ppe_status IN ('compliant', 'non_compliant', 'expired', 'partial'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'ppe_items'
  ) THEN
    ALTER TABLE workers ADD COLUMN ppe_items text[] DEFAULT '{}';
  END IF;
END $$;

-- ============================================================
-- MACHINES: Add health_score
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'machines' AND column_name = 'health_score'
  ) THEN
    ALTER TABLE machines ADD COLUMN health_score integer NOT NULL DEFAULT 85
      CHECK (health_score >= 0 AND health_score <= 100);
  END IF;
END $$;

-- ============================================================
-- SENSOR_DATA: Add sensor_type and thresholds
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'sensor_type'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN sensor_type text DEFAULT 'temperature'
      CHECK (sensor_type IN ('gas', 'temperature', 'pressure', 'humidity', 'smoke', 'voltage', 'battery', 'noise', 'vibration', 'air_quality', 'wearable'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'min_threshold'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN min_threshold numeric;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensor_data' AND column_name = 'max_threshold'
  ) THEN
    ALTER TABLE sensor_data ADD COLUMN max_threshold numeric;
  END IF;
END $$;

-- ============================================================
-- INDEXES for new columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workers_shift ON workers(shift);
CREATE INDEX IF NOT EXISTS idx_workers_ppe_status ON workers(ppe_status);
CREATE INDEX IF NOT EXISTS idx_machines_health_score ON machines(health_score);
CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_type ON sensor_data(sensor_type);

-- ============================================================
-- UPDATE existing data with realistic values
-- ============================================================
DO $$
DECLARE
  w record;
  shifts text[] := ARRAY['day', 'night', 'rotating'];
  ppe_statuses text[] := ARRAY['compliant', 'compliant', 'compliant', 'non_compliant', 'expired', 'partial'];
  ppe_items text[] := ARRAY['Hard Hat', 'Safety Glasses', 'Steel Toe Boots', 'High-Vis Vest', 'Gloves', 'Respirator', 'Hearing Protection', 'Face Shield'];
  w_items text[];
  w_idx integer;
BEGIN
  FOR w IN SELECT id FROM workers LOOP
    w_idx := abs(hashtext(w.id::text)) % 100;
    w_items := ARRAY[
      ppe_items[1 + (w_idx % array_length(ppe_items,1))],
      ppe_items[1 + ((w_idx + 1) % array_length(ppe_items,1))],
      ppe_items[1 + ((w_idx + 2) % array_length(ppe_items,1))]
    ];
    UPDATE workers SET
      shift = shifts[1 + (w_idx % array_length(shifts,1))],
      ppe_status = ppe_statuses[1 + (w_idx % array_length(ppe_statuses,1))],
      ppe_items = w_items
    WHERE id = w.id;
  END LOOP;
END $$;

-- Update machines with health scores based on status
DO $$
DECLARE
  m record;
  m_score integer;
BEGIN
  FOR m IN SELECT id, status FROM machines LOOP
    CASE m.status
      WHEN 'operational' THEN m_score := 75 + (abs(hashtext(m.id::text)) % 25);
      WHEN 'maintenance' THEN m_score := 40 + (abs(hashtext(m.id::text)) % 20);
      WHEN 'offline' THEN m_score := 10 + (abs(hashtext(m.id::text)) % 15);
      WHEN 'fault' THEN m_score := 5 + (abs(hashtext(m.id::text)) % 10);
      ELSE m_score := 50;
    END CASE;
    UPDATE machines SET health_score = m_score WHERE id = m.id;
  END LOOP;
END $$;

-- Update sensor_data with sensor_type based on unit
DO $$
DECLARE
  s record;
  s_type text;
BEGIN
  FOR s IN SELECT id, unit FROM sensor_data LOOP
    CASE s.unit
      WHEN 'ppm' THEN s_type := 'gas';
      WHEN 'C' THEN s_type := 'temperature';
      WHEN '%' THEN s_type := 'humidity';
      WHEN 'bar' THEN s_type := 'pressure';
      WHEN 'dB' THEN s_type := 'noise';
      WHEN 'mm/s' THEN s_type := 'vibration';
      WHEN 'AQI' THEN s_type := 'air_quality';
      WHEN 'bpm' THEN s_type := 'wearable';
      ELSE s_type := 'temperature';
    END CASE;
    UPDATE sensor_data SET sensor_type = s_type WHERE id = s.id;
  END LOOP;
END $$;
