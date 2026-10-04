

create extension if not exists pgcrypto; -- gen_random_uuid()

create type service_status as enum (
  'pending', 'accepted', 'en_route', 'in_progress',
  'completed', 'cancelled', 'disputed'
);

create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type media_type as enum ('photo', 'video');
create type dispute_status as enum ('open', 'reviewing', 'resolved', 'dismissed');



create table clients (
  user_id text primary key references "user"(id) on delete cascade,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table technicians (
  user_id text primary key references "user"(id) on delete cascade,
  bio text,
  average_rating numeric(3,2) not null default 0,
  total_reviews integer not null default 0,
  is_available boolean not null default false,
  is_verified boolean not null default false,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create index idx_technicians_available on technicians (is_available);
create index idx_technicians_location on technicians (latitude, longitude);

create table specialties (
  id serial primary key,
  name text unique not null,
  slug text unique not null
);

create table technician_specialties (
  technician_id text references technicians(user_id) on delete cascade,
  specialty_id integer references specialties(id) on delete cascade,
  primary key (technician_id, specialty_id)
);


create table services (
  id uuid primary key default gen_random_uuid(),
  protocol text unique not null default (
    'OS-' || to_char(now(), 'YYYY') || '-' ||
    lpad((floor(random() * 999999))::text, 6, '0')
  ),
  client_id text not null references clients(user_id),
  technician_id text references technicians(user_id),
  specialty_id integer references specialties(id),
  description text not null,
  status service_status not null default 'pending',
  is_emergency boolean not null default false,
  requested_at timestamptz not null default now(),
  scheduled_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  price numeric(10,2),
  platform_fee numeric(10,2),
  address text,
  latitude double precision,
  longitude double precision
);

create index idx_services_client on services (client_id);
create index idx_services_technician on services (technician_id, status);
create index idx_services_status on services (status);
create index idx_services_emergency on services (is_emergency) where is_emergency = true;

create table service_media (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  url text not null,
  type media_type not null,
  uploaded_at timestamptz not null default now()
);

create table service_status_history (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  status service_status not null,
  changed_by text references "user"(id),
  changed_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  client_id text not null references clients(user_id),
  technician_id text not null references technicians(user_id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (service_id)
);

create index idx_reviews_technician on reviews (technician_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  payment_method text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz not null default now()
);

create table chats (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  sender_id text not null references "user"(id),
  receiver_id text not null references "user"(id),
  message text not null,
  sent_at timestamptz not null default now()
);

create index idx_chats_service on chats (service_id, sent_at);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  opened_by text not null references "user"(id),
  reason text not null,
  status dispute_status not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id, read);



insert into specialties (name, slug) values
  ('Hardware de computador', 'hardware'),
  ('Redes e Wi-Fi', 'redes'),
  ('Instalação de software', 'software'),
  ('Remoção de vírus e malware', 'seguranca'),
  ('Impressoras', 'impressoras'),
  ('Celulares e tablets', 'mobile'),
  ('TVs e smart home', 'smart-home')
on conflict do nothing;
