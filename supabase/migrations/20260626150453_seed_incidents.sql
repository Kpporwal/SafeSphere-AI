/*
# SafeSphere AI — Seed: Incidents (100)

Inserts 100 safety incidents with varied severity and investigation status,
including root cause and corrective actions for resolved incidents.
*/

DO $$
DECLARE
  i integer;
  t text;
  d text;
  sev text;
  stat text;
  loc text;
  occurred timestamptz;
  resolved timestamptz;
  rc text;
  titles text[] := ARRAY['Minor Hand Laceration','Slip and Fall - Wet Floor','Forklift Collision','Chemical Spill','Electrical Shock','Falling Object Injury','Heat Exhaustion','Eye Irritation from Dust','Back Strain - Lifting','Equipment Contact Burn','Near Miss - Dropped Tool','PPE Non-Compliance','Finger Crush - Press','Steam Burn','Fume Inhalation','Trip Hazard - Cable','Crane Load Swing','Confined Space Rescue','Welding Flash Burn','Compressed Air Injury'];
  descriptions text[] := ARRAY['Worker sustained minor laceration while handling sheet metal. First aid applied on site.','Employee slipped on wet floor near washing station. No serious injury reported.','Forklift collided with stationary equipment during maneuvering. Minor damage to both.','Small chemical spill during transfer operation. Contained by spill response team.','Worker received minor electrical shock while servicing panel. Investigating lockout/tagout compliance.','Object fell from height striking worker below. Hard hat prevented serious injury.','Worker showed signs of heat exhaustion during outdoor shift. Moved to cool area and hydrated.','Worker reported eye irritation from airborne dust. Flushed at eyewash station.','Worker experienced back strain while lifting heavy component. Sent for medical evaluation.','Worker contacted hot equipment surface. Minor burn treated with first aid.','Tool dropped from height near worker. No injury but safety violation noted.','Worker observed not wearing required PPE in designated area. Coaching issued.','Worker finger caught in hydraulic press. Emergency stop activated. Minor injury.','Worker sustained minor steam burn near boiler. First aid applied.','Worker inhaled fumes during chemical process. Evaluated by occupational health.','Worker tripped over unsecured cable. No injury but hazard reported.','Crane load swung unexpectedly during lift. Area cleared as precaution.','Worker became disoriented in confined space. Rescue team extracted safely.','Worker experienced flash burn from welding arc. Treated at medical station.','Worker injured by compressed air. Investigating improper use of air gun.'];
  severities text[] := ARRAY['minor','minor','moderate','moderate','serious','critical'];
  statuses_arr text[] := ARRAY['open','investigating','resolved','closed','investigating','resolved'];
  locs text[] := ARRAY['Plant A - Floor 1','Plant A - Floor 2','Plant B - Floor 1','Plant B - Floor 2','Warehouse','Loading Dock','Chemical Storage','Maintenance Shop','Yard','Production Line 1'];
  root_causes text[] := ARRAY['Improper PPE usage','Wet floor not marked','Operator distraction','Equipment malfunction','Inadequate training','Procedural violation','Mechanical failure','Environmental factor','Human error','Design deficiency'];
  actions text[] := ARRAY['Retrained worker on proper technique','Installed warning signage','Repaired equipment','Updated SOP','Conducted safety briefing','Added guardrail','Replaced faulty component','Enhanced PPE requirements','Implemented check procedure','Scheduled additional training'];
BEGIN
  FOR i IN 1..100 LOOP
    t := titles[1 + (i % array_length(titles,1))];
    d := descriptions[1 + (i % array_length(descriptions,1))];
    sev := severities[1 + (i % array_length(severities,1))];
    stat := statuses_arr[1 + (i % array_length(statuses_arr,1))];
    loc := locs[1 + (i % array_length(locs,1))];
    occurred := now() - ((i % 90) || ' days')::interval - ((i % 24) || ' hours')::interval;
    IF (i % 3) = 0 THEN
      resolved := occurred + ((i % 48 + 2) || ' hours')::interval;
      rc := root_causes[1 + (i % array_length(root_causes,1))];
    ELSE
      resolved := NULL;
      rc := NULL;
    END IF;
    INSERT INTO incidents (
      incident_number, title, description, severity, status, location,
      occurred_at, resolved_at, root_cause, corrective_actions,
      injuries, property_damage
    ) VALUES (
      'INC-' || lpad(i::text, 5, '0'),
      t, d, sev, stat, loc, occurred, resolved, rc,
      CASE WHEN resolved IS NOT NULL THEN ARRAY[actions[1 + (i % array_length(actions,1))], actions[1 + ((i + 1) % array_length(actions,1))]] ELSE '{}' END,
      (i % 3),
      (i % 5) * 500
    ) ON CONFLICT (incident_number) DO NOTHING;
  END LOOP;
END $$;
