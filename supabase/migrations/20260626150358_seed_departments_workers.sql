/*
# SafeSphere AI — Seed: Departments & Workers

Inserts 8 departments and 100 workers with realistic dummy data.
*/

INSERT INTO departments (name, code, description) VALUES
  ('Operations', 'OPS', 'Day-to-day production and facility operations'),
  ('Maintenance', 'MNT', 'Equipment maintenance and repair'),
  ('Environment Health & Safety', 'EHS', 'Safety compliance and incident management'),
  ('Quality Assurance', 'QA', 'Product and process quality control'),
  ('Logistics', 'LOG', 'Material handling and supply chain'),
  ('Engineering', 'ENG', 'Process and mechanical engineering'),
  ('Production', 'PRD', 'Manufacturing and assembly lines'),
  ('Administration', 'ADM', 'Management and support services')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
  i integer;
  dept_ids uuid[];
  fn text;
  ln text;
  pos text;
  stat text;
  loc text;
  emp_num text;
  hire_date date;
  training_expiry date;
  first_names text[] := ARRAY['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Elizabeth','David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Christopher','Nancy','Daniel','Lisa','Matthew','Margaret','Anthony','Sandra','Mark','Ashley','Donald','Kimberly','Steven','Emily','Paul','Donna','Andrew','Michelle','Joshua','Carol','Kenneth','Amanda','Kevin','Dorothy','Brian','Melissa','George','Deborah','Edward','Stephanie','Ronald','Rebecca','Timothy','Sharon','Jason','Laura','Jeffrey','Cynthia','Ryan','Kathleen','Jacob','Amy','Gary','Shirley','Nicholas','Angela','Eric','Helen','Jonathan','Anna','Stephen','Brenda','Larry','Pamela','Justin','Nicole','Scott','Samantha','Brandon','Katherine','Benjamin','Christine','Samuel','Debra','Gregory','Rachel','Frank','Catherine','Alexander','Carolyn','Patrick','Janet','Jack','Ruth','Dennis','Maria','Jerry','Heather'];
  last_names text[] := ARRAY['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'];
  positions text[] := ARRAY['Machine Operator','Maintenance Technician','Safety Inspector','Shift Supervisor','Quality Controller','Forklift Operator','Welder','Electrician','Pipefitter','Millwright','Process Engineer','Production Lead','Material Handler','Crane Operator','Instrument Technician','Reliability Engineer','EHS Coordinator','Line Operator','Assembly Worker','Packaging Operator'];
  statuses text[] := ARRAY['active','active','active','active','active','active','active','active','off_duty','on_leave'];
  locations text[] := ARRAY['Plant A - Floor 1','Plant A - Floor 2','Plant B - Floor 1','Plant B - Floor 2','Warehouse','Loading Dock','Maintenance Shop','Control Room','Yard','Chemical Storage'];
BEGIN
  SELECT array_agg(id) FROM departments INTO dept_ids;
  FOR i IN 1..100 LOOP
    emp_num := 'EMP' || lpad(i::text, 4, '0');
    fn := first_names[1 + (i % array_length(first_names,1))];
    ln := last_names[1 + ((i * 7) % array_length(last_names,1))];
    pos := positions[1 + (i % array_length(positions,1))];
    stat := statuses[1 + (i % array_length(statuses,1))];
    loc := locations[1 + (i % array_length(locations,1))];
    hire_date := CURRENT_DATE - (365 * (1 + (i % 15)) + (i % 30))::int;
    training_expiry := CURRENT_DATE + (i % 365 - 100);
    INSERT INTO workers (
      employee_id, full_name, email, phone, department_id, position,
      status, hire_date, safety_training_expiry, location
    ) VALUES (
      emp_num,
      fn || ' ' || ln,
      lower(replace(fn, ' ', '.')) || '.' || ln || '@safesphere.io',
      '+1-555-' || lpad((1000 + i)::text, 4, '0'),
      dept_ids[1 + (i % array_length(dept_ids,1))],
      pos,
      stat,
      hire_date,
      training_expiry,
      loc
    ) ON CONFLICT (employee_id) DO NOTHING;
  END LOOP;
END $$;
