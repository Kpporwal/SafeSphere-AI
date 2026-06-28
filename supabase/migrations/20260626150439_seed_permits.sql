/*
# SafeSphere AI — Seed: Permits (50)

Inserts 50 work permits across all permit types and statuses with
hazard and precaution checklists.
*/

DO $$
DECLARE
  i integer;
  typ text;
  t text;
  stat text;
  loc text;
  start_dt timestamptz;
  end_dt timestamptz;
  haz text[];
  pre text[];
  types text[] := ARRAY['hot_work','confined_space','electrical','height_work','excavation','lifting','chemical'];
  titles text[] := ARRAY['Welding Repair - Pipe Section A','Confined Space Entry - Storage Tank','Electrical Panel Maintenance','Roof Access - HVAC Inspection','Trench Excavation - Pipe Installation','Crane Lift - Heavy Machinery','Chemical Handling - Solvent Transfer','Cutting and Grinding - Steel Frame','Tank Cleaning - Chemical Vessel','Switchgear Replacement','Scaffold Erection - Building B','Pavement Excavation - Cable Laying','Overhead Crane Operation','Acid Transfer - Processing Unit','Hot Tap - Live Pipeline'];
  statuses_arr text[] := ARRAY['draft','pending','approved','rejected','expired','active'];
  locs text[] := ARRAY['Plant A - Floor 1','Plant A - Floor 2','Plant B - Floor 1','Plant B - Floor 2','Warehouse','Loading Dock','Chemical Storage','Yard','Utility Room','Maintenance Shop'];
  hazards text[] := ARRAY['Fire hazard','Toxic gas exposure','Electric shock','Fall from height','Cave-in','Crush injury','Chemical burn','Confined space asphyxiation'];
  precautions text[] := ARRAY['Fire watch required','Gas monitoring','Lockout/tagout','Fall protection harness','Shoring required','Exclusion zone','PPE mandatory','Ventilation required','Buddy system','Emergency rescue plan'];
BEGIN
  FOR i IN 1..50 LOOP
    typ := types[1 + (i % array_length(types,1))];
    t := titles[1 + (i % array_length(titles,1))];
    stat := statuses_arr[1 + (i % array_length(statuses_arr,1))];
    loc := locs[1 + (i % array_length(locs,1))];
    start_dt := now() - ((i % 30) || ' days')::interval + ((i % 7) || ' days')::interval;
    end_dt := start_dt + ((4 + (i % 8)) || ' hours')::interval;
    haz := ARRAY[hazards[1 + (i % array_length(hazards,1))], hazards[1 + ((i + 3) % array_length(hazards,1))]];
    pre := ARRAY[precautions[1 + (i % array_length(precautions,1))], precautions[1 + ((i + 2) % array_length(precautions,1))]];
    INSERT INTO permits (
      permit_number, type, title, description, status, location,
      start_date, end_date, hazards, precautions
    ) VALUES (
      'PRM-' || lpad(i::text, 5, '0'),
      typ,
      t,
      'Work permit for: ' || t || '. All safety protocols must be followed per OSHA guidelines.',
      stat,
      loc,
      start_dt,
      end_dt,
      haz,
      pre
    ) ON CONFLICT (permit_number) DO NOTHING;
  END LOOP;
END $$;
