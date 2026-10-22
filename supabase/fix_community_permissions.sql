begin;

create or replace view public.admin_reports as
select r.id, r.target_type, r.target_id, r.doubt_id, r.reporter_id,
  p.full_name as reporter_name, r.reason, r.details, r.status, r.created_at
from public.reports r
join public.profiles p on p.id = r.reporter_id
where exists (
  select 1
  from public.profiles viewer
  where viewer.id = (select auth.uid())
    and viewer.role = 'admin'
    and viewer.status = 'active'
);

create or replace view public.community_doubts as
select
  d.id, d.title, d.content,
  case when d.is_anonymous and d.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then null
       else d.author_id end as author_id,
  case when d.is_anonymous and d.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then 'Anonymous Student'
       else p.full_name end as author_name,
  case when d.is_anonymous and d.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then 'student'
       else p.role end as author_role,
  case when d.is_anonymous and d.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then ''
       else p.department end as author_department,
  d.is_anonymous, d.category, d.department, d.subject, d.semester, d.tags,
  (select count(*)::integer from public.doubt_votes v where v.doubt_id = d.id) as votes,
  coalesce((select array_agg(v.user_id::text) from public.doubt_votes v
    where v.doubt_id = d.id and v.user_id = (select auth.uid())), '{}') as upvoted_by,
  d.created_at, d.is_closed, d.views
from public.doubts d
join public.profiles p on p.id = d.author_id
cross join lateral (
  select exists (
    select 1
    from public.profiles viewer_profile
    where viewer_profile.id = (select auth.uid())
      and viewer_profile.role = 'admin'
      and viewer_profile.status = 'active'
  ) as can_view_anonymous
) viewer;

create or replace view public.community_answers as
select
  a.id, a.doubt_id, a.content,
  case when a.is_anonymous and a.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then null
       else a.author_id end as author_id,
  case when a.is_anonymous and a.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then 'Anonymous Student'
       else p.full_name end as author_name,
  case when a.is_anonymous and a.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then 'student'
       else p.role end as author_role,
  case when a.is_anonymous and a.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then ''
       else p.department end as author_department,
  case when a.is_anonymous and a.author_id is distinct from (select auth.uid())
         and not viewer.can_view_anonymous then ''
       else p.avatar end as author_avatar,
  a.is_anonymous,
  (select count(*)::integer from public.answer_votes v where v.answer_id = a.id and v.vote = 'upvote') as upvotes,
  coalesce((select array_agg(v.user_id::text) from public.answer_votes v
    where v.answer_id = a.id and v.vote = 'upvote' and v.user_id = (select auth.uid())), '{}') as upvoted_by,
  (select count(*)::integer from public.answer_votes v where v.answer_id = a.id and v.vote = 'correct') as correct_votes,
  (select count(*)::integer from public.answer_votes v where v.answer_id = a.id and v.vote = 'incorrect') as incorrect_votes,
  coalesce((select array_agg(v.user_id::text) from public.answer_votes v
    where v.answer_id = a.id and v.vote = 'correct' and v.user_id = (select auth.uid())), '{}') as voted_correct_by,
  coalesce((select array_agg(v.user_id::text) from public.answer_votes v
    where v.answer_id = a.id and v.vote = 'incorrect' and v.user_id = (select auth.uid())), '{}') as voted_incorrect_by,
  a.is_best_answer, a.is_verified_correct, a.created_at, a.updated_at,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'answerId', c.answer_id, 'content', c.content,
      'authorId', c.author_id, 'authorName', cp.full_name,
      'authorRole', cp.role, 'createdAt', c.created_at
    ) order by c.created_at)
    from public.answer_comments c join public.profiles cp on cp.id = c.author_id
    where c.answer_id = a.id
  ), '[]'::jsonb) as comments
from public.answers a
join public.profiles p on p.id = a.author_id
cross join lateral (
  select exists (
    select 1
    from public.profiles viewer_profile
    where viewer_profile.id = (select auth.uid())
      and viewer_profile.role = 'admin'
      and viewer_profile.status = 'active'
  ) as can_view_anonymous
) viewer;

alter view public.community_profiles owner to postgres;
alter view public.my_bookmarks owner to postgres;
alter view public.admin_reports owner to postgres;
alter view public.community_doubts owner to postgres;
alter view public.community_answers owner to postgres;

alter view public.community_profiles set (security_invoker = false);
alter view public.my_bookmarks set (security_invoker = false);
alter view public.admin_reports set (security_invoker = false);
alter view public.community_doubts set (security_invoker = false);
alter view public.community_answers set (security_invoker = false);

grant usage on schema public to anon, authenticated;
grant select on public.community_profiles, public.community_doubts, public.community_answers to anon, authenticated;
grant select on public.my_bookmarks, public.admin_reports to authenticated;

revoke all on public.doubts, public.doubt_votes, public.bookmarks,
  public.answers, public.answer_votes, public.answer_comments
  from anon, authenticated;
revoke execute on function public.current_profile_role() from public, anon, authenticated;
revoke execute on function public.is_active_user() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_auth_email_confirmation() from public, anon, authenticated;

set local role anon;

select
  (select count(*) from public.community_doubts) as readable_doubts,
  (select count(*) from public.community_profiles) as readable_profiles,
  (select count(*) from public.community_answers) as readable_answers;

reset role;

notify pgrst, 'reload schema';

commit;

select
  c.relname as view_name,
  pg_get_userbyid(c.relowner) as owner,
  coalesce(array_to_string(c.reloptions, ', '), '(default: security_invoker=false)') as options,
  has_table_privilege('anon', c.oid, 'select') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in (
    'community_profiles',
    'my_bookmarks',
    'admin_reports',
    'community_doubts',
    'community_answers'
  )
order by c.relname;
