/*
# SafeSphere AI — Extend Permits with Industry Workflow Fields

This migration minimally extends the existing `permits` table with the
additional columns required by the Permits module UI.

Goals:
- Preserve existing data and compatibility.
- Add only missing columns.
- Reference existing tables via foreign keys.
- Keep RLS enabled and readable/writable by existing policies.

Added columns:
- department_id uuid -> departments(id)
- worker_id uuid -> workers(id)
- machine_id uuid -> machines(id)
- priority text (LOW/MEDIUM/HIGH)
- risk_level text (low/medium/high/critical)
- ppe_required boolean
- safety_precautions text[]
- notes text (freeform)

 */

DO $$
BEGIN
  -- department_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='department_id'
  ) THEN
    ALTER TABLE permits ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE SET NULL;
  END IF;

  -- worker_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='worker_id'
  ) THEN
    ALTER TABLE permits ADD COLUMN worker_id uuid REFERENCES workers(id) ON DELETE SET NULL;
  END IF;

  -- machine_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='machine_id'
  ) THEN
    ALTER TABLE permits ADD COLUMN machine_id uuid REFERENCES machines(id) ON DELETE SET NULL;
  END IF;

  -- priority
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='priority'
  ) THEN
    ALTER TABLE permits ADD COLUMN priority text CHECK (priority IN ('low','medium','high'));
  END IF;

  -- risk_level
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='risk_level'
  ) THEN
    ALTER TABLE permits ADD COLUMN risk_level text CHECK (risk_level IN ('low','medium','high','critical'));
  END IF;

  -- ppe_required
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='ppe_required'
  ) THEN
    ALTER TABLE permits ADD COLUMN ppe_required boolean NOT NULL DEFAULT false;
  END IF;

  -- safety_precautions (separate from existing `precautions`)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='safety_precautions'
  ) THEN
    ALTER TABLE permits ADD COLUMN safety_precautions text[] DEFAULT '{}';
  END IF;

  -- notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='permits' AND column_name='notes'
  ) THEN
    ALTER TABLE permits ADD COLUMN notes text;
  END IF;
END $$;

-- Indexes for filters/search
CREATE INDEX IF NOT EXISTS idx_permits_department_id ON permits(department_id);
CREATE INDEX IF NOT EXISTS idx_permits_worker_id ON permits(worker_id);
CREATE INDEX IF NOT EXISTS idx_permits_machine_id ON permits(machine_id);
CREATE INDEX IF NOT EXISTS idx_permits_priority ON permits(priority);
CREATE INDEX IF NOT EXISTS idx_permits_risk_level ON permits(risk_level);

