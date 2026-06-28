/*
# SafeSphere AI — Core Schema

## Overview
Creates the complete database schema for the SafeSphere AI enterprise safety
intelligence platform. This includes profiles, departments, workers, machines,
sensor data, alerts, permits, incidents, and reports.

## New Tables

1. **departments** — Organizational units (e.g. Operations, Maintenance, EHS).
2. **profiles** — User accounts linked to Supabase Auth. Stores role (admin,
   safety_officer, supervisor), contact info, and department association.
3. **workers** — Frontline workforce records with employee IDs, positions,
   training expiry, and location tracking.
4. **machines** — Industrial equipment with status, maintenance schedules, and
   operating hours.
5. **sensor_data** — Time-series readings from sensors (gas, temperature,
   pressure, etc.) linked to machines.
6. **alerts** — Safety alerts triggered by sensor thresholds or manual reports,
   with severity and acknowledgment tracking.
7. **permits** — Work permits (hot work, confined space, electrical, etc.) with
   approval workflow and hazard/precaution checklists.
8. **incidents** — Safety incidents with severity, investigation status, root
   cause, and corrective actions.
9. **reports** — Generated safety reports with period coverage and summary data.

## Security (RLS)

- RLS enabled on ALL tables.
- All policies scoped to `TO authenticated` (sign-in required).
- Operational data (departments, workers, machines, sensors, alerts, permits,
  incidents) is readable by all authenticated users — shared operational data.
- Writes on operational tables allowed for all authenticated users.
- `profiles` is owner-scoped for updates; all authenticated can read (directory).
- `reports` is owner-scoped: users see only their own reports.

## Important Notes

1. All tables use `gen_random_uuid()` for primary keys.
2. Timestamps default to `now()`.
3. Foreign keys use `ON DELETE SET NULL` for optional references.
4. Indexes added for frequently-queried columns.
5. Enum-like columns use TEXT with CHECK constraints for flexibility.
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DEPARTMENTS (created first, referenced by profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_departments" ON departments;
CREATE POLICY "insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_departments" ON departments;
CREATE POLICY "update_departments" ON departments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_departments" ON departments;
CREATE POLICY "delete_departments" ON departments FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'safety_officer' CHECK (role IN ('admin', 'safety_officer', 'supervisor')),
  avatar_url text,
  phone text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Now link departments.manager_id to profiles (added after profiles exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'departments_manager_id_fkey' AND table_name = 'departments'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT departments_manager_id_fkey
      FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- WORKERS
-- ============================================================
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  position text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'off_duty', 'on_leave', 'inactive')),
  hire_date date NOT NULL,
  safety_training_expiry date,
  avatar_url text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_workers" ON workers;
CREATE POLICY "select_workers" ON workers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_workers" ON workers;
CREATE POLICY "insert_workers" ON workers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_workers" ON workers;
CREATE POLICY "update_workers" ON workers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_workers" ON workers;
CREATE POLICY "delete_workers" ON workers FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- MACHINES
-- ============================================================
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  type text NOT NULL,
  location text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'offline', 'fault')),
  manufacturer text,
  model text,
  install_date date NOT NULL,
  last_maintenance timestamptz,
  next_maintenance timestamptz,
  operating_hours integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_machines" ON machines;
CREATE POLICY "select_machines" ON machines FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_machines" ON machines;
CREATE POLICY "insert_machines" ON machines FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_machines" ON machines;
CREATE POLICY "update_machines" ON machines FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_machines" ON machines;
CREATE POLICY "delete_machines" ON machines FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- SENSOR_DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id text NOT NULL,
  machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,
  reading_value numeric NOT NULL,
  unit text NOT NULL,
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning', 'critical')),
  recorded_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_sensor_data" ON sensor_data;
CREATE POLICY "select_sensor_data" ON sensor_data FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_sensor_data" ON sensor_data;
CREATE POLICY "insert_sensor_data" ON sensor_data FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_sensor_data" ON sensor_data;
CREATE POLICY "update_sensor_data" ON sensor_data FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_sensor_data" ON sensor_data;
CREATE POLICY "delete_sensor_data" ON sensor_data FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  sensor_id text,
  machine_id uuid REFERENCES machines(id) ON DELETE SET NULL,
  worker_id uuid REFERENCES workers(id) ON DELETE SET NULL,
  location text,
  acknowledged_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_alerts" ON alerts;
CREATE POLICY "select_alerts" ON alerts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_alerts" ON alerts;
CREATE POLICY "insert_alerts" ON alerts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_alerts" ON alerts;
CREATE POLICY "update_alerts" ON alerts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_alerts" ON alerts;
CREATE POLICY "delete_alerts" ON alerts FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PERMITS
-- ============================================================
CREATE TABLE IF NOT EXISTS permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_number text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('hot_work', 'confined_space', 'electrical', 'height_work', 'excavation', 'lifting', 'chemical')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'expired', 'active')),
  location text NOT NULL,
  requested_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  hazards text[] DEFAULT '{}',
  precautions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE permits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_permits" ON permits;
CREATE POLICY "select_permits" ON permits FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_permits" ON permits;
CREATE POLICY "insert_permits" ON permits FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_permits" ON permits;
CREATE POLICY "update_permits" ON permits FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_permits" ON permits;
CREATE POLICY "delete_permits" ON permits FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- INCIDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'serious', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  location text NOT NULL,
  reported_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL,
  resolved_at timestamptz,
  root_cause text,
  corrective_actions text[] DEFAULT '{}',
  injuries integer NOT NULL DEFAULT 0,
  property_damage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_incidents" ON incidents;
CREATE POLICY "select_incidents" ON incidents FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_incidents" ON incidents;
CREATE POLICY "insert_incidents" ON incidents FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_incidents" ON incidents;
CREATE POLICY "update_incidents" ON incidents FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_incidents" ON incidents;
CREATE POLICY "delete_incidents" ON incidents FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'completed', 'failed')),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  summary text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "update_own_reports" ON reports;
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);

CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_workers_department ON workers(department_id);
CREATE INDEX IF NOT EXISTS idx_workers_employee_id ON workers(employee_id);

CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_department ON machines(department_id);
CREATE INDEX IF NOT EXISTS idx_machines_location ON machines(location);

CREATE INDEX IF NOT EXISTS idx_sensor_data_sensor_id ON sensor_data(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_machine_id ON sensor_data(machine_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_recorded_at ON sensor_data(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_status ON sensor_data(status);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
CREATE INDEX IF NOT EXISTS idx_permits_type ON permits(type);
CREATE INDEX IF NOT EXISTS idx_permits_start_date ON permits(start_date);

CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at ON incidents(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_author ON reports(author_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permits_updated_at ON permits;
CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
