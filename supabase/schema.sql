-- SoonerRide schema. Mirrors src/lib/types.ts one-to-one.

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique check (email ilike '%@ou.edu'),
  major text,
  year text,
  rating numeric(2,1) not null default 5.0,
  trip_count int not null default 0,
  car jsonb,                       -- { make, color, plate }
  avatar_color text not null default '#8A7A62'
);

create table circles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('game','airport','holiday','event')),
  destination text not null,
  date date not null,
  description text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table circle_members (
  circle_id uuid references circles(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references users(id),
  "from" text not null,
  from_detail text not null,
  "to" text not null,
  to_detail text not null default '',
  depart_at timestamptz not null,
  seats_total int not null check (seats_total between 1 and 6),
  price_per_seat int,              -- null = free
  note text,
  circle_id uuid references circles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table seat_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references rides(id) on delete cascade,
  passenger_id uuid not null references users(id),
  seats int not null default 1,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on rides (depart_at);
create index on seat_requests (ride_id);
