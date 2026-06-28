/*
# SafeSphere AI — Seed: Machines (200)

Inserts 200 machines across various types, manufacturers, and locations
with realistic maintenance schedules and operating hours.
*/

DO $$
DECLARE
  i integer;
  dept_ids uuid[];
  mt text;
  mfr text;
  loc text;
  stat text;
  install_date date;
  last_maint timestamptz;
  next_maint timestamptz;
  machine_types text[] := ARRAY['CNC Mill','Lathe','Press Brake','Welding Robot','Conveyor Belt','Hydraulic Press','Injection Molder','Forklift','Air Compressor','Boiler','Chiller','Pump Station','Crane','Packaging Line','Assembly Robot','Grinder','Drill Press','Heat Exchanger','Generator','Dust Collector'];
  manufacturers text[] := ARRAY['Siemens','ABB','Bosch','Mitsubishi','Haas','Caterpillar','Komatsu','Allen-Bradley','Fanuc','Yaskawa','Omron','Schneider Electric','Honeywell','Emerson','GE','Atlas Copco','Ingersoll Rand','Dover','Parker Hannifin','Johnson Controls'];
  locs text[] := ARRAY['Plant A - Floor 1','Plant A - Floor 2','Plant B - Floor 1','Plant B - Floor 2','Warehouse','Maintenance Shop','Yard','Utility Room','Production Line 1','Production Line 2','Production Line 3'];
  statuses text[] := ARRAY['operational','operational','operational','operational','operational','operational','maintenance','offline','fault'];
BEGIN
  SELECT array_agg(id) FROM departments INTO dept_ids;
  FOR i IN 1..200 LOOP
    mt := machine_types[1 + (i % array_length(machine_types,1))];
    mfr := manufacturers[1 + (i % array_length(manufacturers,1))];
    loc := locs[1 + (i % array_length(locs,1))];
    stat := statuses[1 + (i % array_length(statuses,1))];
    install_date := CURRENT_DATE - (365 * (2 + (i % 10)) + (i % 60))::int;
    last_maint := now() - (i % 90 || ' days')::interval;
    next_maint := now() + ((i % 60 + 10) || ' days')::interval;
    INSERT INTO machines (
      name, code, type, location, department_id, status,
      manufacturer, model, install_date, last_maintenance,
      next_maintenance, operating_hours
    ) VALUES (
      mt || ' ' || to_char(i, 'FM000'),
      'MCH-' || lpad(i::text, 4, '0'),
      mt,
      loc,
      dept_ids[1 + (i % array_length(dept_ids,1))],
      stat,
      mfr,
      'Model-' || (1000 + (i % 900)),
      install_date,
      last_maint,
      next_maint,
      (i * 137) % 50000
    ) ON CONFLICT (code) DO NOTHING;
  END LOOP;
END $$;
