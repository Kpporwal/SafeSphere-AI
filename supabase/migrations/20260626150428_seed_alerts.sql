/*
# SafeSphere AI — Seed: Alerts (60)

Inserts 60 safety alerts with varied severity and status, linked to
sensors, machines, and workers.
*/

DO $$
DECLARE
  i integer;
  machine_ids uuid[];
  worker_ids uuid[];
  t text;
  d text;
  sev text;
  stat text;
  loc text;
  titles text[] := ARRAY['Gas Level Exceeded','Temperature Critical','Pressure Anomaly','Vibration Spike','Noise Threshold Breached','Air Quality Degraded','Equipment Overheating','Sensor Offline','Wearable Alert','Chemical Leak Detected','Motor Failure Imminent','Safety Zone Violation'];
  descriptions text[] := ARRAY['Sensor reading exceeded safe operating threshold. Immediate inspection required.','Temperature has exceeded the critical limit. Equipment shutdown recommended.','Abnormal pressure detected. Verify system integrity.','Vibration levels indicate potential bearing failure.','Noise levels exceed OSHA permissible exposure limit.','Air quality index in hazardous range. Evacuate area.','Equipment temperature approaching failure point.','Sensor has gone offline. Check connectivity and power.','Worker wearable detected abnormal vital signs.','Chemical sensor detected leak. Isolate area immediately.','Predictive maintenance alert: motor failure likely.','Worker entered restricted safety zone without authorization.'];
  severities text[] := ARRAY['low','medium','high','critical'];
  statuses_arr text[] := ARRAY['active','active','acknowledged','resolved'];
  locs text[] := ARRAY['Plant A - Floor 1','Plant A - Floor 2','Plant B - Floor 1','Plant B - Floor 2','Warehouse','Loading Dock','Chemical Storage','Utility Room'];
BEGIN
  SELECT array_agg(id) FROM machines LIMIT 50 INTO machine_ids;
  SELECT array_agg(id) FROM workers LIMIT 50 INTO worker_ids;
  FOR i IN 1..60 LOOP
    t := titles[1 + (i % array_length(titles,1))];
    d := descriptions[1 + (i % array_length(descriptions,1))];
    sev := severities[1 + (i % array_length(severities,1))];
    stat := statuses_arr[1 + (i % array_length(statuses_arr,1))];
    loc := locs[1 + (i % array_length(locs,1))];
    INSERT INTO alerts (
      title, description, severity, status, sensor_id, machine_id,
      worker_id, location, created_at
    ) VALUES (
      t, d, sev, stat,
      'SEN-' || lpad((i * 7 % 500 + 1)::text, 5, '0'),
      machine_ids[1 + (i % array_length(machine_ids,1))],
      CASE WHEN i % 3 = 0 THEN worker_ids[1 + (i % array_length(worker_ids,1))] ELSE NULL END,
      loc,
      now() - (i || ' hours')::interval
    );
  END LOOP;
END $$;
