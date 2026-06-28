/*
# SafeSphere AI — Seed: Sensor Data (500 sensors, 1000 readings)

Inserts 500 unique sensors with 2 readings each (1000 total), distributed
across machines with varied statuses and realistic reading values per type.
*/

DO $$
DECLARE
  i integer;
  j integer;
  machine_ids uuid[];
  sensor_types text[] := ARRAY['gas','temperature','humidity','pressure','noise','vibration','air_quality','wearable'];
  units text[] := ARRAY['ppm','C','%','bar','dB','mm/s','AQI','bpm'];
  sensor_id text;
  reading numeric;
  status_val text;
  recorded_at_val timestamptz;
  type_idx integer;
BEGIN
  SELECT array_agg(id) FROM machines LIMIT 200 INTO machine_ids;
  FOR i IN 1..500 LOOP
    sensor_id := 'SEN-' || lpad(i::text, 5, '0');
    type_idx := 1 + (i % array_length(sensor_types,1));
    FOR j IN 1..2 LOOP
      recorded_at_val := now() - (j * 300 + (i % 300) || ' seconds')::interval;
      CASE type_idx
        WHEN 1 THEN reading := 5 + (random() * 50);
        WHEN 2 THEN reading := 18 + (random() * 25);
        WHEN 3 THEN reading := 30 + (random() * 50);
        WHEN 4 THEN reading := 1 + (random() * 4);
        WHEN 5 THEN reading := 60 + (random() * 40);
        WHEN 6 THEN reading := 1 + (random() * 8);
        WHEN 7 THEN reading := 20 + (random() * 80);
        ELSE reading := 60 + (random() * 40);
      END CASE;
      IF reading > 80 THEN
        status_val := 'critical';
      ELSIF reading > 70 THEN
        status_val := 'warning';
      ELSIF (i + j) % 20 = 0 THEN
        status_val := 'offline';
      ELSE
        status_val := 'online';
      END IF;
      INSERT INTO sensor_data (
        sensor_id, machine_id, reading_value, unit, status, recorded_at
      ) VALUES (
        sensor_id,
        machine_ids[1 + (i % array_length(machine_ids,1))],
        round(reading::numeric, 2),
        units[type_idx],
        status_val,
        recorded_at_val
      );
    END LOOP;
  END LOOP;
END $$;
