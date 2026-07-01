/*
# SafeSphere AI — Minimal extension for Incidents module UI fields

Adds optional fields required by the Incidents UI:
- category
- department_id
- worker_id
- machine_id
- sensor_id
- notes

Preserves existing data and keeps all new columns nullable.
*/

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS department_id uuid,
  ADD COLUMN IF NOT EXISTS worker_id uuid,
  ADD COLUMN IF NOT EXISTS machine_id uuid,
  ADD COLUMN IF NOT EXISTS sensor_id uuid,
  ADD COLUMN IF NOT EXISTS notes text;

-- Foreign keys (only added if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'incidents_department_id_fkey'
  ) THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'incidents_worker_id_fkey'
  ) THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_worker_id_fkey
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'incidents_machine_id_fkey'
  ) THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_machine_id_fkey
      FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'incidents_sensor_id_fkey'
  ) THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_sensor_id_fkey
      FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE SET NULL;
  END IF;
END $$;

