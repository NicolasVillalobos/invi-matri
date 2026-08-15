-- =========================================================
--  Nicolás y Perla — esquema de la base de datos
--  Pégalo completo en:  Supabase → SQL Editor → New query → Run
-- =========================================================

-- ---------- Confirmaciones de asistencia ----------
create table if not exists public.rsvps (
  id                       uuid primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  nombre                   text        not null check (char_length(nombre) between 2 and 120),
  asiste                   boolean     not null,
  preferencia_alimentaria  text        check (preferencia_alimentaria in ('Vegano','Vegetariano','Pescetariano','Sin preferencia')),
  alergias                 text        check (alergias is null or char_length(alergias) <= 240),
  mensaje                  text        check (mensaje  is null or char_length(mensaje)  <= 400)
);

-- ---------- Sugerencias de canciones ----------
create table if not exists public.canciones (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  cancion     text        not null check (char_length(cancion) between 2 and 160),
  enlace      text        check (enlace is null or enlace ~ '^https?://')
);

-- =========================================================
--  Seguridad (RLS)
--  Los invitados solo pueden INSERTAR. Nadie puede leer,
--  editar ni borrar con la anon key: para ver las respuestas
--  usa el Table Editor de Supabase (usa la service role).
-- =========================================================
alter table public.rsvps     enable row level security;
alter table public.canciones enable row level security;

drop policy if exists "invitados pueden confirmar"        on public.rsvps;
drop policy if exists "invitados pueden sugerir cancion"  on public.canciones;

create policy "invitados pueden confirmar"
  on public.rsvps for insert to anon
  with check (true);

create policy "invitados pueden sugerir cancion"
  on public.canciones for insert to anon
  with check (true);

-- =========================================================
--  Vistas de consulta rápida (úsalas desde el SQL Editor)
-- =========================================================
create or replace view public.resumen_rsvp as
select
  count(*)                                    as respuestas,
  count(*) filter (where asiste)              as confirmados,
  count(*) filter (where not asiste)          as no_asisten,
  count(*) filter (where preferencia_alimentaria = 'Vegano')        as veganos,
  count(*) filter (where preferencia_alimentaria = 'Vegetariano')   as vegetarianos,
  count(*) filter (where preferencia_alimentaria = 'Pescetariano')  as pescetarianos,
  count(*) filter (where alergias is not null and alergias <> '')   as con_alergias
from public.rsvps;
