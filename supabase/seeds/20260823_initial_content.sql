-- Données initiales : la première admin + les 6 Reels Mandala existants
insert into public.admin_users (email) values ('meyer.florent@gmail.com')
on conflict (email) do nothing;

insert into public.workouts
  (title, subtitle, description, duration_min, category_id, level, goals, video_url, thumbnail_url, premium, calories, published, sort_order)
values
  ('Rolling Back — Défi #16',
   'Abdos profonds, contrôle du centre et mobilité de la colonne.',
   'Le défi : rouler en arrière et revenir sans élan, tout en contrôle ! Un exercice signature du Pilates Matwork.',
   1, 'pilates', 'intermediate', '{strength,mobility}',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-videos/defi-16-rolling-back.mp4',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-thumbs/defi-16-rolling-back.jpg',
   false, 8, true, 1),
  ('3 exercices, 3 niveaux',
   'Choisis ta variation et progresse à ton rythme.',
   'Débutant, intermédiaire ou avancé — chaque niveau a sa variation pour progresser en douceur.',
   1, 'pilates', 'beginner', '{strength,energy}',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-videos/3-niveaux.mp4',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-thumbs/3-niveaux.jpg',
   false, 8, true, 2),
  ('Gainage latéral — Défi #15',
   'Quatre étapes pour renforcer centre, équilibre et posture.',
   'De la demi-pointe au gainage sur une main : une progression complète vers un centre fort.',
   1, 'pilates', 'advanced', '{strength,energy}',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-videos/defi-15-gainage.mp4',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-thumbs/defi-15-gainage.jpg',
   true, 10, true, 3),
  ('Shoulder Bridge une jambe',
   'Trois variantes pour les fessiers, les ischios et le centre.',
   'Stabilité, force et contrôle : un vrai travail Pilates Matwork pour le bas du corps.',
   2, 'pilates', 'intermediate', '{strength,mobility}',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-videos/shoulder-bridge.mp4',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-thumbs/shoulder-bridge.jpg',
   true, 12, true, 4),
  ('La Centaine dynamique',
   'Un flow Pilates Matwork pour réveiller les abdos profonds.',
   'Jambes en chaise renversée, étirées, en alternance puis en ciseaux : la Centaine version dynamique.',
   1, 'pilates', 'intermediate', '{strength,energy}',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-videos/centaine.mp4',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-thumbs/centaine.jpg',
   true, 10, true, 5),
  ('Eka Padasana — Challenge #12',
   'Équilibre, concentration et force sur coussin instable.',
   'La posture sur une jambe sur coussin d’équilibre : stabilité, concentration et force.',
   1, 'yoga', 'advanced', '{mobility,relaxation,strength}',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-videos/eka-padasana.mp4',
   'https://ldnybpkzhcmzvneyaqfi.supabase.co/storage/v1/object/public/workout-thumbs/eka-padasana.jpg',
   true, 7, true, 6)
on conflict do nothing;

-- Programmes
with w as (select id from public.workouts order by sort_order)
insert into public.programs (title, description, duration_weeks, published)
select 'Les essentiels Pilates Matwork',
       'Six mouvements officiels Mandala pour travailler contrôle, force profonde et mobilité.',
       3, true
where not exists (select 1 from public.programs where title = 'Les essentiels Pilates Matwork');

insert into public.program_workouts (program_id, workout_id, position)
select p.id, w.id, w.sort_order
from public.programs p, public.workouts w
where p.title = 'Les essentiels Pilates Matwork'
  and not exists (select 1 from public.program_workouts pw where pw.program_id = p.id);

-- Défi 6 jours
insert into public.challenges (title, description, days, published)
select '6 jours, 6 défis Mandala',
       'Un Reel officiel par jour pour explorer le Pilates Matwork progressivement.',
       6, true
where not exists (select 1 from public.challenges where title = '6 jours, 6 défis Mandala');

insert into public.challenge_workouts (challenge_id, day_number, workout_id)
select c.id, w.sort_order, w.id
from public.challenges c, public.workouts w
where c.title = '6 jours, 6 défis Mandala' and w.sort_order <= 6
  and not exists (select 1 from public.challenge_workouts cw where cw.challenge_id = c.id);
