-- =========================================================
-- Mandala Yoga & Pilates — schéma de gestion de contenus
-- Tables : workouts, programs, program_workouts, challenges,
-- challenge_workouts, admin_users
-- Sécurité : RLS — lecture publique, écriture admins uniquement
-- =========================================================

-- 1) Table des administratrices (emails autorisés à modifier le contenu)
create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

-- 2) Catégories (Yoga, Pilates, Mobilité, Respiration…)
create table if not exists public.categories (
  id text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into public.categories (id, label, sort_order) values
  ('yoga', 'Yoga', 1),
  ('pilates', 'Pilates', 2),
  ('mobilite', 'Mobilité', 3),
  ('respiration', 'Respiration', 4)
on conflict (id) do nothing;

-- 3) Séances vidéo
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  duration_min int not null check (duration_min > 0 and duration_min <= 180),
  category_id text references public.categories(id) on update cascade,
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  goals text[] not null default '{}',
  video_url text not null,
  thumbnail_url text,
  premium boolean not null default false,
  calories int not null default 100,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workouts_published_idx on public.workouts(published);
create index if not exists workouts_category_idx on public.workouts(category_id);

-- 4) Programmes (regroupent plusieurs séances)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  duration_weeks int not null default 4,
  thumbnail_url text,
  premium boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.program_workouts (
  program_id uuid references public.programs(id) on delete cascade,
  workout_id uuid references public.workouts(id) on delete cascade,
  position int not null default 0,
  primary key (program_id, workout_id)
);

-- 5) Défis (challenge N jours)
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  days int not null default 7,
  thumbnail_url text,
  premium boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_workouts (
  challenge_id uuid references public.challenges(id) on delete cascade,
  day_number int not null,
  workout_id uuid references public.workouts(id) on delete cascade,
  primary key (challenge_id, day_number)
);

-- 6) updated_at automatique
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists workouts_touch on public.workouts;
create trigger workouts_touch before update on public.workouts
for each row execute function public.touch_updated_at();

-- =========================================================
-- SÉCURITÉ (RLS)
-- =========================================================

alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.workouts enable row level security;
alter table public.programs enable row level security;
alter table public.program_workouts enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_workouts enable row level security;

-- Fonction helper : l'utilisateur courant est-il admin ?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    exists (
      select 1 from public.admin_users a
      where a.email = auth.jwt() ->> 'email'
    ),
    false
  );
$$;

-- Lecture publique du contenu publié
create policy "public read categories" on public.categories for select using (true);
create policy "public read workouts" on public.workouts for select using (published or public.is_admin());
create policy "public read programs" on public.programs for select using (published or public.is_admin());
create policy "public read program_workouts" on public.program_workouts for select using (true);
create policy "public read challenges" on public.challenges for select using (published or public.is_admin());
create policy "public read challenge_workouts" on public.challenge_workouts for select using (true);
create policy "admin read admins" on public.admin_users for select using (auth.jwt() ->> 'email' = email);

-- Écriture réservée aux admins
create policy "admin write workouts" on public.workouts for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write programs" on public.programs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write program_workouts" on public.program_workouts for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write challenges" on public.challenges for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write challenge_workouts" on public.challenge_workouts for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- STORAGE — buckets vidéos et miniatures
-- =========================================================
insert into storage.buckets (id, name, public) values ('workout-videos','workout-videos', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('workout-thumbs','workout-thumbs', true) on conflict do nothing;

create policy "public read videos" on storage.objects for select using (bucket_id = 'workout-videos');
create policy "public read thumbs" on storage.objects for select using (bucket_id = 'workout-thumbs');
create policy "admin upload videos" on storage.objects for insert with check (bucket_id = 'workout-videos' and public.is_admin());
create policy "admin upload thumbs" on storage.objects for insert with check (bucket_id = 'workout-thumbs' and public.is_admin());
