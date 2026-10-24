-- SoonerRide database setup. Paste into Supabase → SQL Editor → Run.
-- Safe to run more than once. Columns mirror src/lib/types.ts (camelCase ↔ snake_case).
-- Sample data is not inserted here: the app seeds an empty database on first load,
-- and Profile → "Reset demo data" re-seeds it with dates relative to today.

create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  major text,
  year text,
  rating real not null default 5,
  trip_count int not null default 0,
  car jsonb,                         -- { make, color, plate }
  avatar_color text not null
);

create table if not exists circles (
  id text primary key,
  title text not null,
  category text not null check (category in ('game', 'airport', 'holiday', 'event')),
  destination text not null,
  date date not null,
  description text,
  created_by text not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists circle_members (
  circle_id text not null references circles(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists rides (
  id text primary key,
  driver_id text not null references users(id) on delete cascade,
  "from" text not null,
  from_detail text not null,
  "to" text not null,
  to_detail text not null default '',
  depart_at timestamptz not null,
  seats_total int not null check (seats_total between 1 and 6),
  price_per_seat int,                -- null = free
  note text,
  circle_id text references circles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists seat_requests (
  id text primary key,
  ride_id text not null references rides(id) on delete cascade,
  passenger_id text not null references users(id) on delete cascade,
  seats int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rides_depart_at_idx on rides (depart_at);
create index if not exists seat_requests_ride_id_idx on seat_requests (ride_id);

-- Demo access: the app has no real accounts yet, so the public (anon) key can
-- read and write everything. Fine for a hackathon demo, NOT for real students.
do $$
declare t text;
begin
  foreach t in array array['users', 'circles', 'circle_members', 'rides', 'seat_requests'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "demo open access" on %I', t);
    execute format('create policy "demo open access" on %I for all to anon, authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on %I to anon, authenticated', t);
    -- Live updates
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- v2: gas share pricing, completed rides, thank-you tips. Additive and safe to re-run.
alter table users add column if not exists venmo text;
alter table users add column if not exists cashapp text;
alter table users add column if not exists zelle text;

alter table rides add column if not exists distance_miles int;
alter table rides add column if not exists extra_miles int;
alter table rides add column if not exists stops_note text;
alter table rides add column if not exists price_reason text;
alter table rides add column if not exists status text not null default 'open';
alter table rides add column if not exists completed_at timestamptz;

alter table seat_requests add column if not exists rating int check (rating between 1 and 5);
alter table seat_requests add column if not exists thanks_note text;
alter table seat_requests add column if not exists tip_amount int;
alter table seat_requests add column if not exists tip_method text check (tip_method in ('venmo', 'cashapp', 'zelle'));
alter table seat_requests add column if not exists feedback_at timestamptz;

-- Make the API see the new columns right away.
notify pgrst, 'reload schema';
