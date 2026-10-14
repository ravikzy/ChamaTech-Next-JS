

create extension if not exists pgcrypto; -- gen_random_uuid()

-- Registra o aceite de termos e privacidade no momento do cadastro.
alter table "user" add column if not exists terms_accepted boolean not null default false;
alter table "user" add column if not exists terms_accepted_at timestamptz;
alter table "user" add column if not exists email_notifications boolean not null default true;

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null references "user"(id),
  action text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_created_at on admin_audit_logs (created_at desc);

do $$ begin
  create type service_status as enum (
    'pending', 'accepted', 'en_route', 'in_progress',
    'completed', 'cancelled', 'disputed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');
exception when duplicate_object then null; end $$;
do $$ begin create type media_type as enum ('photo', 'video');
exception when duplicate_object then null; end $$;
do $$ begin create type dispute_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;



create table if not exists clients (
  user_id text primary key references "user"(id) on delete cascade,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table if not exists technicians (
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

create index if not exists idx_technicians_available on technicians (is_available);
create index if not exists idx_technicians_location on technicians (latitude, longitude);

create table if not exists specialties (
  id serial primary key,
  name text unique not null,
  slug text unique not null
);

create table if not exists technician_specialties (
  technician_id text references technicians(user_id) on delete cascade,
  specialty_id integer references specialties(id) on delete cascade,
  primary key (technician_id, specialty_id)
);


create table if not exists services (
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

create index if not exists idx_services_client on services (client_id);
create index if not exists idx_services_technician on services (technician_id, status);
create index if not exists idx_services_status on services (status);
create index if not exists idx_services_emergency on services (is_emergency) where is_emergency = true;

create table if not exists service_media (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  url text not null,
  type media_type not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists service_status_history (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  status service_status not null,
  changed_by text references "user"(id),
  changed_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  client_id text not null references clients(user_id),
  technician_id text not null references technicians(user_id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  technician_reply text,
  replied_at timestamptz,
  is_hidden boolean not null default false,
  hidden_by text references "user"(id),
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  unique (service_id)
);

-- Compatibilidade com instalações criadas antes das avaliações moderáveis.
alter table reviews add column if not exists tags text[] not null default '{}';
alter table reviews add column if not exists technician_reply text;
alter table reviews add column if not exists replied_at timestamptz;
alter table reviews add column if not exists is_hidden boolean not null default false;
alter table reviews add column if not exists hidden_by text references "user"(id);
alter table reviews add column if not exists hidden_at timestamptz;

create index if not exists idx_reviews_technician on reviews (technician_id);

create table if not exists review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  reporter_id text not null references "user"(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reviewed_by text references "user"(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

create index if not exists idx_review_reports_open on review_reports (created_at desc) where status = 'open';
create index if not exists idx_reviews_public on reviews (technician_id, created_at desc) where is_hidden = false;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  payment_method text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz not null default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  sender_id text not null references "user"(id),
  receiver_id text not null references "user"(id),
  message text not null,
  sent_at timestamptz not null default now()
);

create index if not exists idx_chats_service on chats (service_id, sent_at);

create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  opened_by text not null references "user"(id),
  reason text not null,
  status dispute_status not null default 'open',
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications add column if not exists href text;

create index if not exists idx_notifications_user on notifications (user_id, read);



insert into specialties (name, slug) values
  ('Hardware de computador', 'hardware'),
  ('Redes e Wi-Fi', 'redes'),
  ('Instalação de software', 'software'),
  ('Remoção de vírus e malware', 'seguranca'),
  ('Impressoras', 'impressoras'),
  ('Celulares e tablets', 'mobile'),
  ('TVs e smart home', 'smart-home')
on conflict do nothing;
