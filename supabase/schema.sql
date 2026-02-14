create extension if not exists "pgcrypto";
create extension if not exists btree_gist;

create type appointment_status as enum ('pendiente', 'confirmado', 'cancelado', 'atendido');
create type app_role as enum (
  'site_admin',
  'clinic_admin',
  'clinic_secretary',
  'professional_secretary',
  'professional'
);
create type payment_method as enum ('efectivo', 'transferencia', 'tarjeta', 'otro');

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  active_clinic_id uuid references clinics(id) on delete set null,
  full_name text not null,
  email text not null,
  role app_role not null default 'clinic_admin',
  created_at timestamptz not null default now()
);

create table if not exists clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  clinic_id uuid not null references clinics(id) on delete cascade,
  role app_role not null default 'clinic_secretary',
  created_at timestamptz not null default now(),
  unique (profile_id, clinic_id)
);

create table if not exists social_insurances (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  plan text,
  created_at timestamptz not null default now()
);

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  specialty text not null,
  email text,
  phone text,
  color text not null default '#0f766e',
  created_at timestamptz not null default now()
);

create table if not exists professional_secretary_assignments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, professional_id)
);

create table if not exists consult_rooms (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  name text not null,
  location_hint text,
  created_at timestamptz not null default now(),
  unique (clinic_id, name)
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  full_name text not null,
  dni text,
  phone text,
  email text,
  notes text,
  social_insurance_id uuid references social_insurances(id) on delete set null,
  social_insurance_number text,
  created_at timestamptz not null default now()
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  consult_room_id uuid references consult_rooms(id) on delete set null,
  professional_id uuid not null references professionals(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status appointment_status not null default 'pendiente',
  notes text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists medical_visits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid not null references patients(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  visit_at timestamptz not null default now(),
  reason text,
  diagnosis text,
  treatment text,
  notes text,
  amount_paid numeric(12,2) not null default 0,
  payment_method payment_method not null default 'efectivo',
  created_at timestamptz not null default now()
);

create table if not exists visit_attachments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id) on delete cascade,
  visit_id uuid not null references medical_visits(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists memberships_profile_idx on clinic_memberships (profile_id, clinic_id);
create index if not exists professionals_clinic_idx on professionals (clinic_id);
create index if not exists patients_clinic_idx on patients (clinic_id);
create index if not exists consult_rooms_clinic_idx on consult_rooms (clinic_id);
create index if not exists appointments_clinic_idx on appointments (clinic_id);
create index if not exists appointments_professional_idx on appointments (professional_id, start_at);
create index if not exists visits_clinic_idx on medical_visits (clinic_id, visit_at desc);
create index if not exists visit_attachments_clinic_idx on visit_attachments (clinic_id, visit_id);

alter table appointments drop constraint if exists appointments_no_overlap;
alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status <> 'cancelado');

create or replace function app_current_clinic_id()
returns uuid
language sql
stable
as $$
  select active_clinic_id from profiles where id = auth.uid();
$$;

create or replace function app_is_site_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'site_admin'
  );
$$;

create or replace function app_has_clinic_access(target_clinic_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from profiles p
    where p.id = auth.uid() and p.active_clinic_id = target_clinic_id
  )
  or exists (
    select 1
    from clinic_memberships cm
    where cm.profile_id = auth.uid() and cm.clinic_id = target_clinic_id
  )
  or app_is_site_admin();
$$;

create or replace function set_default_clinic_id()
returns trigger
language plpgsql
as $$
begin
  if new.clinic_id is null then
    new.clinic_id := app_current_clinic_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_professionals_default_clinic_id on professionals;
create trigger trg_professionals_default_clinic_id
before insert on professionals
for each row
execute function set_default_clinic_id();

drop trigger if exists trg_patients_default_clinic_id on patients;
create trigger trg_patients_default_clinic_id
before insert on patients
for each row
execute function set_default_clinic_id();

drop trigger if exists trg_consult_rooms_default_clinic_id on consult_rooms;
create trigger trg_consult_rooms_default_clinic_id
before insert on consult_rooms
for each row
execute function set_default_clinic_id();

drop trigger if exists trg_availability_default_clinic_id on availability;
create trigger trg_availability_default_clinic_id
before insert on availability
for each row
execute function set_default_clinic_id();

drop trigger if exists trg_appointments_default_clinic_id on appointments;
create trigger trg_appointments_default_clinic_id
before insert on appointments
for each row
execute function set_default_clinic_id();

drop trigger if exists trg_medical_visits_default_clinic_id on medical_visits;
create trigger trg_medical_visits_default_clinic_id
before insert on medical_visits
for each row
execute function set_default_clinic_id();

drop trigger if exists trg_visit_attachments_default_clinic_id on visit_attachments;
create trigger trg_visit_attachments_default_clinic_id
before insert on visit_attachments
for each row
execute function set_default_clinic_id();

alter table clinics enable row level security;
alter table profiles enable row level security;
alter table clinic_memberships enable row level security;
alter table social_insurances enable row level security;
alter table professionals enable row level security;
alter table professional_secretary_assignments enable row level security;
alter table consult_rooms enable row level security;
alter table patients enable row level security;
alter table availability enable row level security;
alter table appointments enable row level security;
alter table medical_visits enable row level security;
alter table visit_attachments enable row level security;

drop policy if exists "Profiles are readable by owner" on profiles;
drop policy if exists "Profiles can be updated by owner" on profiles;
drop policy if exists "Profiles can be inserted by owner" on profiles;
create policy "Profiles are readable by owner" on profiles for select using (id = auth.uid());
create policy "Profiles can be updated by owner" on profiles for update using (id = auth.uid());
create policy "Profiles can be inserted by owner" on profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "Clinics are readable by members" on clinics;
drop policy if exists "Clinics can be inserted by authenticated users" on clinics;
create policy "Clinics are readable by members" on clinics for select using (app_has_clinic_access(id));
create policy "Clinics can be inserted by authenticated users" on clinics for insert to authenticated with check (true);
create policy "Clinics can be updated by site admin" on clinics for update using (app_is_site_admin()) with check (app_is_site_admin());

drop policy if exists "Memberships by clinic access" on clinic_memberships;
drop policy if exists "Memberships readable" on clinic_memberships;
drop policy if exists "Memberships insert own" on clinic_memberships;
drop policy if exists "Memberships manage by site admin" on clinic_memberships;
create policy "Memberships readable" on clinic_memberships for select
  using (app_has_clinic_access(clinic_id) or profile_id = auth.uid());
create policy "Memberships insert own" on clinic_memberships for insert
  to authenticated
  with check (profile_id = auth.uid() or app_is_site_admin());
create policy "Memberships manage by site admin" on clinic_memberships for update
  using (app_is_site_admin())
  with check (app_is_site_admin());
create policy "Memberships delete by site admin" on clinic_memberships for delete
  using (app_is_site_admin());

drop policy if exists "Social insurances readable" on social_insurances;
create policy "Social insurances readable" on social_insurances for select using (true);
create policy "Social insurances write by site admin" on social_insurances for all
  using (app_is_site_admin())
  with check (app_is_site_admin());

drop policy if exists "Professionals access by clinic" on professionals;
create policy "Professionals access by clinic" on professionals for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Professional secretary assignments access" on professional_secretary_assignments;
create policy "Professional secretary assignments access" on professional_secretary_assignments for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Consult rooms access by clinic" on consult_rooms;
create policy "Consult rooms access by clinic" on consult_rooms for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Patients access by clinic" on patients;
create policy "Patients access by clinic" on patients for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Availability access by clinic" on availability;
create policy "Availability access by clinic" on availability for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Appointments access by clinic" on appointments;
create policy "Appointments access by clinic" on appointments for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Visits access by clinic" on medical_visits;
create policy "Visits access by clinic" on medical_visits for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));

drop policy if exists "Visit attachments access by clinic" on visit_attachments;
create policy "Visit attachments access by clinic" on visit_attachments for all
  using (app_has_clinic_access(clinic_id))
  with check (app_has_clinic_access(clinic_id));
