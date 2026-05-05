-- ─────────────────────────────────────────────────────────────────────────────
-- NEMEF — Migración: notas, tags de posts y pilares de contenido
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Notas rápidas ─────────────────────────────────────────────────────────────
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  content     text not null default '',
  pinned      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger para auto-actualizar updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_updated_at on notes;
create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();

-- ── Tags de posts ──────────────────────────────────────────────────────────────
create table if not exists post_tags (
  post_id  uuid not null references posts(id) on delete cascade,
  tag      text not null check (char_length(tag) between 1 and 50),
  primary key (post_id, tag)
);

create index if not exists post_tags_post_id_idx on post_tags(post_id);
create index if not exists post_tags_tag_idx on post_tags(tag);

-- ── Pilares de contenido ───────────────────────────────────────────────────────
create table if not exists post_pillars (
  post_id    uuid not null references posts(id) on delete cascade,
  pillar_id  text not null,
  primary key (post_id)
);

-- Pilares configurados por el usuario (opcional — los defaults están en lib/pillars.ts)
create table if not exists content_pillars (
  id           text primary key,    -- slug como "educacion", "cripto"
  name         text not null,
  description  text not null default '',
  color        text not null default 'bg-primary/15',
  text_color   text not null default 'text-primary',
  border_color text not null default 'border-primary/30',
  emoji        text not null default '📌',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ── Proyectos de contenido ─────────────────────────────────────────────────────
create table if not exists projects (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  topic            text not null default '',
  status           text not null default 'active'
                   check (status in ('active', 'paused', 'completed', 'archived')),
  platform         text not null default 'instagram',
  target_audience  text default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create table if not exists project_chapters (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  title        text not null default '',
  summary      text default '',
  content      text default '',
  status       text not null default 'draft'
               check (status in ('draft', 'in_progress', 'done')),
  order_index  integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists chapters_updated_at on project_chapters;
create trigger chapters_updated_at
  before update on project_chapters
  for each row execute function update_updated_at();

create index if not exists chapters_project_id_idx on project_chapters(project_id);

-- ── RLS (Row Level Security) ───────────────────────────────────────────────────
-- Dashboard de usuario único — RLS simple: acceso público (ajustar si se agrega auth)
alter table notes            enable row level security;
alter table post_tags         enable row level security;
alter table post_pillars      enable row level security;
alter table content_pillars   enable row level security;
alter table projects          enable row level security;
alter table project_chapters  enable row level security;

-- Política permisiva para dashboard monousuario
create policy "allow_all_notes"           on notes            for all using (true) with check (true);
create policy "allow_all_post_tags"       on post_tags         for all using (true) with check (true);
create policy "allow_all_post_pillars"    on post_pillars      for all using (true) with check (true);
create policy "allow_all_content_pillars" on content_pillars   for all using (true) with check (true);
create policy "allow_all_projects"        on projects          for all using (true) with check (true);
create policy "allow_all_chapters"        on project_chapters  for all using (true) with check (true);

-- ── Tabla de configuración del sistema ────────────────────────────────────────
create table if not exists settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;
create policy "allow_all_settings" on settings for all using (true) with check (true);

-- ── Newsletters guardados ──────────────────────────────────────────────────────
create table if not exists saved_newsletters (
  id          uuid primary key default gen_random_uuid(),
  subject     text not null default '',
  title       text not null,
  subtitle    text not null default '',
  topic       text not null default '',
  data        jsonb not null,
  html_body   text,
  created_at  timestamptz not null default now()
);

alter table saved_newsletters enable row level security;
create policy "allow_all_saved_newsletters" on saved_newsletters for all using (true) with check (true);
