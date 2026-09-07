-- Mandala — compatibilité du panneau admin avec le schéma de contenus existant.
-- Cette migration est autonome : elle ne dépend pas encore du schéma RevenueCat.

alter table public.workouts
  add column if not exists video_object_path text,
  add column if not exists thumbnail_object_path text;

alter table public.workouts alter column video_url drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workouts'::regclass
      and conname = 'workouts_video_location_check'
  ) then
    alter table public.workouts add constraint workouts_video_location_check
      check (nullif(video_url, '') is not null or nullif(video_object_path, '') is not null)
      not valid;
  end if;
end $$;

update public.workouts
set video_object_path = substring(video_url from '/workout-videos/(.+)$')
where video_object_path is null
  and video_url like '%/storage/v1/object/public/workout-videos/%';

update public.workouts
set thumbnail_object_path = substring(thumbnail_url from '/workout-thumbs/(.+)$')
where thumbnail_object_path is null
  and thumbnail_url like '%/storage/v1/object/public/workout-thumbs/%';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('workout-videos-private', 'workout-videos-private', false, 524288000,
   array['video/mp4', 'video/quicktime']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'workout-thumbs';

drop policy if exists "authenticated read private videos" on storage.objects;
create policy "authenticated read private videos"
on storage.objects for select to authenticated
using (
  bucket_id = 'workout-videos-private'
  and (
    public.is_admin()
    or exists (
      select 1 from public.workouts w
      where w.video_object_path = storage.objects.name
        and w.published
        and not w.premium
    )
  )
);

drop policy if exists "admin upload private videos" on storage.objects;
create policy "admin upload private videos"
on storage.objects for insert to authenticated
with check (bucket_id = 'workout-videos-private' and public.is_admin());

drop policy if exists "admin update private videos" on storage.objects;
create policy "admin update private videos"
on storage.objects for update to authenticated
using (bucket_id = 'workout-videos-private' and public.is_admin())
with check (bucket_id = 'workout-videos-private' and public.is_admin());

drop policy if exists "admin delete private videos" on storage.objects;
create policy "admin delete private videos"
on storage.objects for delete to authenticated
using (bucket_id = 'workout-videos-private' and public.is_admin());

drop policy if exists "admin update thumbs" on storage.objects;
create policy "admin update thumbs"
on storage.objects for update to authenticated
using (bucket_id = 'workout-thumbs' and public.is_admin())
with check (bucket_id = 'workout-thumbs' and public.is_admin());

drop policy if exists "admin delete thumbs" on storage.objects;
create policy "admin delete thumbs"
on storage.objects for delete to authenticated
using (bucket_id = 'workout-thumbs' and public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.workouts to anon, authenticated;
grant insert, update, delete on public.workouts to authenticated;
