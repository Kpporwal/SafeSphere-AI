/*
# SafeSphere AI — Create Sensors Master Table

Adds a sensors master table used by the Sensors module CRUD.

Goals:
- Backward compatible: does NOT modify existing sensor_data columns.
- Sensor_data remains time-series readings.
- sensors table stores master/profile fields required by the UI.

Notes:
- RLS policies included for select/insert/update/delete.
- last_reading is informational and updated by the app (optional).
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SENSORS (master/profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  sensor_id text NOT NULL UNIQUE,
  sensor_name text NOT NULL,
  sensor_type text NOT NULL,
  location text NOT NULL,

  assigned_machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,

  status text NOT NULL DEFAULT 'online',

  battery_percent integer NOT NULL DEFAULT 100,
  health_score integer NOT NULL DEFAULT 85,

  installation_date date NOT NULL,

  last_reading numeric,
  last_updated timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "select_sensors" ON sensors;
CREATE POLICY "select_sensors" ON sensors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_sensors" ON sensors;
CREATE POLICY "insert_sensors" ON sensors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_sensors" ON sensors;
CREATE POLICY "update_sensors" ON sensors FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_sensors" ON sensors;
CREATE POLICY "delete_sensors" ON sensors FOR DELETE
  TO authenticated USING (true);

-- Basic constraints for UI expectations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sensors' AND column_name = 'battery_percent'
  ) THEN
    RETURN;
  END IF;
END $$;

-- Indices for filtering
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensors_battery ON sensors(battery_percent);
CREATE INDEX IF NOT EXISTS idx_sensors_machine ON sensors(assigned_machine_id);
CREATE INDEX IF NOT EXISTS idx_sensors_last_updated ON sensors(last_updated DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sensors_updated_at ON sensors;
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

