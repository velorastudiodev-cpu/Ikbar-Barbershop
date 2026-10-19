-- Run this migration in the Supabase SQL editor after deploying the CMS code.
-- The app also accepts CMS_ADMIN_EMAILS, but direct Supabase access is governed
-- by this database policy and should use a trusted app_metadata role.

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      or lower(coalesce(auth.jwt() ->> 'email', '')) = 'velorastudiodev@gmail.com';
$$;

-- Replace the old "any authenticated user" write policies.
drop policy if exists "Authenticated users only" on sales;
drop policy if exists "Authenticated users only" on cash;
drop policy if exists "Authenticated users only" on hpp;
drop policy if exists "Authenticated users only" on cash_log;
drop policy if exists "Authenticated write site_content" on site_content;
drop policy if exists "Authenticated write gallery_items" on gallery_items;
drop policy if exists "Authenticated write services" on services;

create policy "CMS admins can manage sales" on sales for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy "CMS admins can manage cash" on cash for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy "CMS admins can manage hpp" on hpp for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy "CMS admins can manage cash log" on cash_log for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy "CMS admins can manage site content" on site_content for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy "CMS admins can manage gallery" on gallery_items for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy "CMS admins can manage services" on services for all
  using (public.is_cms_admin()) with check (public.is_cms_admin());

-- Storage policies are project-specific. In Supabase Storage, remove any old
-- site-media INSERT/UPDATE/DELETE policy that checks only auth.role(), then
-- create policies equivalent to these predicates:
--   bucket_id = 'site-media' AND public.is_cms_admin()
-- Public SELECT may remain enabled when the site-media bucket is public.
