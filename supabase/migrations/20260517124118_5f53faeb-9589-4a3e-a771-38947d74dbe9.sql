
-- ELECTIVES
create table public.electives (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null check (category in ('PE-IV','PE-V','PE-VI')),
  total_seats int not null default 60,
  remaining_seats int not null default 60,
  created_at timestamptz not null default now()
);
alter table public.electives enable row level security;
create policy "electives_public_read" on public.electives for select using (true);

-- STUDENTS
create table public.students (
  id uuid primary key default gen_random_uuid(),
  register_number text unique not null,
  name text,
  section text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;

-- REGISTRATIONS
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  register_number text unique not null,
  name text not null,
  section text not null,
  email text not null,
  pe4_elective_id uuid references public.electives(id),
  pe4_replacement text,
  pe5_elective_id uuid references public.electives(id),
  pe5_replacement text,
  pe6_elective_id uuid references public.electives(id),
  pe6_replacement text,
  created_at timestamptz not null default now()
);
alter table public.registrations enable row level security;

-- RESERVATIONS
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  register_number text not null,
  elective_id uuid not null references public.electives(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(register_number, elective_id)
);
alter table public.reservations enable row level security;
create policy "reservations_public_read" on public.reservations for select using (true);

create index idx_reservations_expires on public.reservations(expires_at);
create index idx_reservations_elective on public.reservations(elective_id);

-- Realtime
alter publication supabase_realtime add table public.electives;
alter publication supabase_realtime add table public.reservations;

-- Helper: count active reservations per elective (not expired, excluding caller)
create or replace function public.active_reservations_count(p_elective_id uuid, p_exclude_reg text default null)
returns int language sql stable as $$
  select count(*)::int from public.reservations
  where elective_id = p_elective_id
    and expires_at > now()
    and (p_exclude_reg is null or register_number <> p_exclude_reg);
$$;

-- Expire stale reservations
create or replace function public.expire_reservations()
returns void language sql security definer set search_path = public as $$
  delete from public.reservations where expires_at <= now();
$$;

-- Atomic registration: locks rows, decrements seats, rolls back on any failure
create or replace function public.register_student_atomic(
  p_register_number text,
  p_name text,
  p_section text,
  p_email text,
  p_pe4_id uuid, p_pe4_repl text,
  p_pe5_id uuid, p_pe5_repl text,
  p_pe6_id uuid, p_pe6_repl text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student_id uuid;
  v_existing uuid;
  v_remaining int;
  v_code text;
begin
  -- Clear expired holds first
  delete from public.reservations where expires_at <= now();

  -- Duplicate check
  select id into v_existing from public.registrations where register_number = p_register_number;
  if v_existing is not null then
    return jsonb_build_object('success', false, 'error', 'You have already registered.');
  end if;

  -- Lock & decrement each chosen elective in deterministic order
  if p_pe4_id is not null then
    select remaining_seats, code into v_remaining, v_code
      from public.electives where id = p_pe4_id for update;
    if v_remaining <= 0 then
      return jsonb_build_object('success', false, 'error', 'PE-IV ('||v_code||') is full.');
    end if;
    update public.electives set remaining_seats = remaining_seats - 1 where id = p_pe4_id;
  end if;

  if p_pe5_id is not null then
    select remaining_seats, code into v_remaining, v_code
      from public.electives where id = p_pe5_id for update;
    if v_remaining <= 0 then
      if p_pe4_id is not null then
        update public.electives set remaining_seats = remaining_seats + 1 where id = p_pe4_id;
      end if;
      return jsonb_build_object('success', false, 'error', 'PE-V ('||v_code||') is full.');
    end if;
    update public.electives set remaining_seats = remaining_seats - 1 where id = p_pe5_id;
  end if;

  if p_pe6_id is not null then
    select remaining_seats, code into v_remaining, v_code
      from public.electives where id = p_pe6_id for update;
    if v_remaining <= 0 then
      if p_pe4_id is not null then
        update public.electives set remaining_seats = remaining_seats + 1 where id = p_pe4_id;
      end if;
      if p_pe5_id is not null then
        update public.electives set remaining_seats = remaining_seats + 1 where id = p_pe5_id;
      end if;
      return jsonb_build_object('success', false, 'error', 'PE-VI ('||v_code||') is full.');
    end if;
    update public.electives set remaining_seats = remaining_seats - 1 where id = p_pe6_id;
  end if;

  -- Upsert student
  insert into public.students (register_number, name, section, email)
    values (p_register_number, p_name, p_section, p_email)
    on conflict (register_number) do update
      set name = excluded.name, section = excluded.section, email = excluded.email
    returning id into v_student_id;

  -- Insert registration
  insert into public.registrations (student_id, register_number, name, section, email,
    pe4_elective_id, pe4_replacement, pe5_elective_id, pe5_replacement, pe6_elective_id, pe6_replacement)
    values (v_student_id, p_register_number, p_name, p_section, p_email,
      p_pe4_id, p_pe4_repl, p_pe5_id, p_pe5_repl, p_pe6_id, p_pe6_repl);

  -- Drop holds for this student
  delete from public.reservations where register_number = p_register_number;

  return jsonb_build_object('success', true);
end;
$$;

-- Reserve seat (2-min hold). Refreshes existing reservation by the same student.
create or replace function public.reserve_seat(
  p_register_number text,
  p_elective_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_remaining int;
  v_active int;
begin
  delete from public.reservations where expires_at <= now();

  -- Refresh own hold
  update public.reservations
    set expires_at = now() + interval '1 second'
    where register_number = p_register_number and elective_id = p_elective_id;
  if found then
    return jsonb_build_object('success', true, 'expires_at', now() + interval '1 second');
  end if;

  select remaining_seats into v_remaining from public.electives where id = p_elective_id for update;
  select count(*) into v_active from public.reservations
    where elective_id = p_elective_id and expires_at > now()
      and register_number <> p_register_number;

  if v_remaining - v_active <= 0 then
    return jsonb_build_object('success', false, 'error', 'No seats available.');
  end if;

  insert into public.reservations (register_number, elective_id, expires_at)
    values (p_register_number, p_elective_id, now() + interval '1 second')
    on conflict (register_number, elective_id) do update set expires_at = excluded.expires_at;

  return jsonb_build_object('success', true, 'expires_at', now() + interval '1 second');
end;
$$;

-- Release a hold
create or replace function public.release_seat(p_register_number text, p_elective_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.reservations where register_number = p_register_number and elective_id = p_elective_id;
$$;

grant execute on function public.reserve_seat(text, uuid) to anon, authenticated;
grant execute on function public.release_seat(text, uuid) to anon, authenticated;
grant execute on function public.active_reservations_count(uuid, text) to anon, authenticated;

-- Seed electives
insert into public.electives (code, name, category, total_seats, remaining_seats) values
  ('EC22032','Antennas for Wireless Communication Systems','PE-IV',60,60),
  ('EC22034','EMI/EMC Pre Compliance Testing','PE-IV',60,60),
  ('EC22037','Millimeter Wave Antenna Technology','PE-IV',60,60),
  ('EC22021','Cognitive Radio','PE-V',60,60),
  ('EC22071','Blockchain and Smart Contract','PE-V',60,60),
  ('EC22044','Low Power IC Design','PE-V',60,60),
  ('EC22029','Next Generation Mobile Networks 5G','PE-VI',60,60),
  ('EC22022','Emerging Wireless Technologies','PE-VI',60,60),
  ('EC22057','Image Analysis and Machine Vision','PE-VI',60,60);
