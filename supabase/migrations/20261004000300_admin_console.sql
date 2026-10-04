drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can view all requests" on public.appointment_requests;
create policy "Admins can view all requests" on public.appointment_requests
  for select to authenticated
  using ((select public.is_admin()));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  today date := public.local_today();
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'students', (
      select jsonb_build_object(
        'total', count(*),
        'verified', count(*) filter (where verification_status = 'verified'),
        'pending', count(*) filter (where verification_status = 'pending'),
        'rejected', count(*) filter (where verification_status = 'rejected')
      ) from public.profiles where role = 'student'
    ),
    'faculty', (
      select jsonb_build_object(
        'total', count(*),
        'verified', count(*) filter (where verification_status = 'verified'),
        'pending', count(*) filter (where verification_status = 'pending'),
        'rejected', count(*) filter (where verification_status = 'rejected'),
        'available', count(*) filter (where verification_status = 'verified' and presence_status = 'available')
      ) from public.profiles where role = 'faculty'
    ),
    'appointments', (
      select jsonb_build_object(
        'total', count(*),
        'pending', count(*) filter (where status = 'pending'),
        'confirmed', count(*) filter (where status = 'confirmed'),
        'declined', count(*) filter (where status = 'declined'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'today', count(*) filter (where preferred_date = today and status in ('pending', 'confirmed')),
        'upcoming', count(*) filter (where preferred_date >= today and status = 'confirmed')
      ) from public.appointment_requests
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'date', day,
        'requests', (select count(*) from public.appointment_requests a where (a.created_at at time zone 'Asia/Manila')::date = day),
        'signUps', (select count(*) from public.profiles p where p.role in ('student', 'faculty') and (p.created_at at time zone 'Asia/Manila')::date = day)
      ) order by day)
      from (select today - offset_days as day from generate_series(0, 13) as offset_days) days
    ),
    'recent', (
      select coalesce(jsonb_agg(item order by (item ->> 'at') desc), '[]'::jsonb)
      from (
        select * from (
          select jsonb_build_object('kind', 'sign_up', 'name', p.full_name, 'role', p.role, 'at', p.created_at) as item
          from public.profiles p where p.role in ('student', 'faculty')
          order by p.created_at desc limit 8
        ) a
        union all
        select * from (
          select jsonb_build_object('kind', 'request', 'name', coalesce(r.student_name, 'A student'), 'role', 'student', 'detail', r.faculty_name, 'at', r.created_at)
          from public.appointment_requests r
          order by r.created_at desc limit 8
        ) b
        union all
        select * from (
          select jsonb_build_object('kind', 'review_' || v.decision, 'name', p.full_name, 'role', p.role, 'at', v.created_at)
          from public.verification_reviews v join public.profiles p on p.id = v.profile_id
          order by v.created_at desc limit 8
        ) c
      ) recent_items
    )
  ) into result;

  select jsonb_set(result, '{recent}', coalesce((
    select jsonb_agg(value order by value ->> 'at' desc)
    from (select value from jsonb_array_elements(result -> 'recent') order by value ->> 'at' desc limit 10) top
  ), '[]'::jsonb)) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;
