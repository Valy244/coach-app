-- =====================================================================
--  Coach App · schéma de la base de données (Supabase)
--  À coller UNE SEULE FOIS dans Supabase : SQL Editor → New query → Run
-- =====================================================================

-- ---------- Tables ----------

-- Le compte coach (le tout premier compte créé devient le coach)
create table if not exists public.coaches (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Réglages de la méthode et du PDF (une seule ligne)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- Les clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  name text not null,
  objectif text not null default 'Hypertrophie',
  weeks_total int not null default 8 check (weeks_total between 4 and 12),
  cycle int not null default 1,
  current_week int not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Une ligne par semaine de programme
create table if not exists public.weeks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  cycle int not null,
  num int not null,
  seances jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, cycle, num)
);
create index if not exists weeks_client_idx on public.weeks (client_id, cycle, num);

-- Les performances et le bilan d'une semaine (saisis par le client)
create table if not exists public.feedback (
  week_id uuid primary key references public.weeks(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  sets jsonb not null default '{}'::jsonb,   -- { idExercice: [ {load, reps, rir, done}, ... ] }
  energie int check (energie between 1 and 5),
  nerveux int check (nerveux between 1 and 5),
  sommeil int check (sommeil between 1 and 5),
  douleurs text not null default '',
  remarques text not null default '',
  submitted boolean not null default false,
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists feedback_client_idx on public.feedback (client_id);

-- Illustrations d'exercices importées par le coach
create table if not exists public.images (
  id text primary key,
  name text not null default '',
  data text not null,
  created_at timestamptz not null default now()
);

-- ---------- Fonctions utilitaires ----------

create or replace function public.is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.coaches where user_id = auth.uid());
$$;

create or replace function public.my_client_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.clients where user_id = auth.uid();
$$;

-- Permet à l'écran de connexion de savoir si le compte coach existe déjà
create or replace function public.coach_exists() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.coaches);
$$;

-- À la création d'un compte : le premier devient coach, les suivants sont
-- reliés à la fiche client qui porte le même e-mail (créée par le coach).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.coaches) then
    insert into public.coaches (user_id) values (new.id);
  else
    update public.clients set user_id = new.id
     where lower(email) = lower(new.email) and user_id is null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Horodatage automatique
create or replace function public.touch() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists weeks_touch on public.weeks;
create trigger weeks_touch before update on public.weeks for each row execute function public.touch();
drop trigger if exists feedback_touch on public.feedback;
create trigger feedback_touch before update on public.feedback for each row execute function public.touch();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch();

-- ---------- Sécurité : chaque client ne voit que ses propres données ----------

alter table public.coaches  enable row level security;
alter table public.settings enable row level security;
alter table public.clients  enable row level security;
alter table public.weeks    enable row level security;
alter table public.feedback enable row level security;
alter table public.images   enable row level security;

drop policy if exists "coach_self" on public.coaches;
create policy "coach_self" on public.coaches for select to authenticated using (user_id = auth.uid());

drop policy if exists "settings_read" on public.settings;
create policy "settings_read" on public.settings for select to authenticated using (true);
drop policy if exists "settings_coach" on public.settings;
create policy "settings_coach" on public.settings for all to authenticated using (public.is_coach()) with check (public.is_coach());

drop policy if exists "clients_coach" on public.clients;
create policy "clients_coach" on public.clients for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists "clients_self" on public.clients;
create policy "clients_self" on public.clients for select to authenticated using (user_id = auth.uid());

drop policy if exists "weeks_coach" on public.weeks;
create policy "weeks_coach" on public.weeks for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists "weeks_client_read" on public.weeks;
create policy "weeks_client_read" on public.weeks for select to authenticated
  using (published and client_id = public.my_client_id());

drop policy if exists "feedback_coach" on public.feedback;
create policy "feedback_coach" on public.feedback for all to authenticated using (public.is_coach()) with check (public.is_coach());
drop policy if exists "feedback_client_read" on public.feedback;
create policy "feedback_client_read" on public.feedback for select to authenticated
  using (client_id = public.my_client_id());
drop policy if exists "feedback_client_insert" on public.feedback;
create policy "feedback_client_insert" on public.feedback for insert to authenticated
  with check (client_id = public.my_client_id()
    and exists (select 1 from public.weeks w where w.id = week_id and w.client_id = public.my_client_id() and w.published));
drop policy if exists "feedback_client_update" on public.feedback;
create policy "feedback_client_update" on public.feedback for update to authenticated
  using (client_id = public.my_client_id())
  with check (client_id = public.my_client_id()
    and exists (select 1 from public.weeks w where w.id = week_id and w.client_id = public.my_client_id() and w.published));

drop policy if exists "images_read" on public.images;
create policy "images_read" on public.images for select to authenticated using (true);
drop policy if exists "images_coach" on public.images;
create policy "images_coach" on public.images for all to authenticated using (public.is_coach()) with check (public.is_coach());

-- ---------- Droits d'accès de l'API ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.coaches, public.settings, public.clients, public.weeks, public.feedback, public.images to authenticated;
revoke all on function public.coach_exists() from public;
grant execute on function public.coach_exists() to anon, authenticated;
grant execute on function public.is_coach() to authenticated;
grant execute on function public.my_client_id() to authenticated;
