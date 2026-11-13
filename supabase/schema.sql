-- ============================================================
--  Supabase - esquema inicial
--  Ejecutar en: Supabase Dashboard > SQL Editor
--  o con: supabase db push
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Usuarios ----------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,           -- bcrypt
  full_name     text not null,
  role          text not null default 'supervisor'
                check (role in ('admin','rrhh','supervisor','colaborador')),
  area          text,                    -- area/departamento del supervisor
  created_at    timestamptz not null default now()
);

-- ---------- Temas de desarrollo organizacional ----------
create table if not exists public.topics (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  description text,
  image_url   text,                      -- portada del tema (URL de imagen)
  slide_images jsonb default '{}',       -- imagenes por tipo de slide: {cover, objectives, content, activity, evaluation, close}
  slide_urls  text[] default '{}',       -- URLs especificas por cada slide (en orden de aparicion)
  content     text,                      -- guion / contenido base
  category    text default 'Desarrollo Organizacional',
  status      text not null default 'draft'
              check (status in ('draft','published','archived')),
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now()
);

-- ---------- Evaluaciones (cuestionarios por tema) ----------
create table if not exists public.evaluations (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  title       text not null,
  questions   jsonb not null default '[]',   -- [{id, text, options[], correctIndex}]
  created_at  timestamptz not null default now()
);

-- ---------- Asignaciones: evaluacion -> area/colaboradores ----------
create table if not exists public.assignments (
  id             uuid primary key default gen_random_uuid(),
  evaluation_id  uuid not null references public.evaluations(id) on delete cascade,
  topic_id       uuid references public.topics(id) on delete set null,
  area           text not null,              -- area supervisada
  supervisor_id  uuid references public.users(id),
  due_date       date,
  status         text not null default 'open'
                 check (status in ('open','closed')),
  created_at     timestamptz not null default now()
);

-- ---------- Respuestas / intentos ----------
create table if not exists public.responses (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references public.assignments(id) on delete cascade,
  user_id        uuid references public.users(id),
  answers        jsonb not null default '[]',   -- [{questionId, selectedIndex}]
  score          numeric(5,2),                   -- % aciertos
  submitted_at   timestamptz not null default now()
);

-- ---------- Matrices de habilidades (resultado agregado por area/colaborador) ----------
create table if not exists public.skill_matrices (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.assignments(id) on delete cascade,
  area          text not null,
  collaborator  text,                            -- null = agregado del area
  topic_title   text,
  score         numeric(5,2) not null default 0, -- % avance
  level         text default 'En desarrollo'
                check (level in ('Inicial','En desarrollo','Competente','Avanzado','Experto')),
  generated_at  timestamptz not null default now(),
  unique (assignment_id, area, collaborator, topic_title)
);

-- ---------- Trabajos generados (presentaciones / videos / correos) ----------
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('presentation','video','email_report')),
  status      text not null default 'queued'
              check (status in ('queued','processing','done','failed')),
  payload     jsonb not null default '{}',
  result      jsonb,
  worker_id   text,
  error       text,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);

-- ---------- Indices ----------
create index if not exists idx_topics_status   on public.topics(status);
create index if not exists idx_assignments_area on public.assignments(area);
create index if not exists idx_responses_assign on public.responses(assignment_id);
create index if not exists idx_jobs_status     on public.jobs(status);
create index if not exists idx_matrices_area   on public.skill_matrices(area);

-- ---------- Row Level Security ----------
-- El backend usa service_role (bypass RLS). Si expones tablas al frontend
-- con anon key, define politicas aqui. Por defecto todo pasa por la API.
alter table public.users           enable row level security;
alter table public.topics          enable row level security;
alter table public.evaluations     enable row level security;
alter table public.assignments     enable row level security;
alter table public.responses       enable row level security;
alter table public.skill_matrices  enable row level security;
alter table public.jobs            enable row level security;
alter table public.topics add column if not exists image_url text;

-- ---------- Recuperación de contraseña ----------
alter table public.users add column if not exists reset_token text;
alter table public.users add column if not exists reset_token_expires timestamptz;
