-- =========================================================
-- Correctif sécurité : lecture de admin_users pour la vérification
-- du panneau d'administration.
--
-- La policy actuelle "admin read admins" compare l'email du JWT à la
-- ligne, mais le SELECT échoue AVANT l'évaluation de la policy car
-- aucun GRANT SELECT n'a été donné sur admin_users. Résultat : la
-- vérification côté panneau renvoie "pas administrateur" même pour
-- un vrai admin.
--
-- Ce script :
--   1. donne le privilège SELECT (la policy limite ensuite les lignes
--      visibles à celles dont l'email correspond au JWT) ;
--   2. recrée la policy proprement pour éviter tout doublon ;
--   3. s'assure que meyer.florent@gmail.com est bien dans la table.
-- =========================================================

grant select on table public.admin_users to anon, authenticated;

drop policy if exists "admin read admins" on public.admin_users;
create policy "admin read admins"
  on public.admin_users
  for select
  using (auth.jwt() ->> 'email' = email);

insert into public.admin_users (email)
values ('meyer.florent@gmail.com')
on conflict (email) do nothing;
