-- Correctif : droits de lecture pour anon et authenticated
-- (nécessaire car les tables ont été créées via le SQL Editor sans les grants par défaut)
grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.workouts to anon, authenticated;
grant select on table public.programs to anon, authenticated;
grant select on table public.program_workouts to anon, authenticated;
grant select on table public.challenges to anon, authenticated;
grant select on table public.challenge_workouts to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
