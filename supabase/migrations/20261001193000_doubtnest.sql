create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'senior', 'faculty', 'admin')),
  requested_role text check (requested_role in ('faculty', 'admin')),
  department text not null default '',
  year text not null default '',
  roll_number text not null default '',
  avatar text not null default '',
  status text not null default 'active' check (status in ('active', 'suspended', 'blocked')),
  is_verified boolean not null default false,
  reputation_points integer not null default 10 check (reputation_points >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists requested_role text
  check (requested_role in ('faculty', 'admin'));

create table if not exists public.doubts (
  id text primary key,
  title text not null,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default false,
  category text not null,
  department text not null,
  subject text not null,
  semester text not null,
  tags text[] not null default '{}',
  is_closed boolean not null default false,
  views integer not null default 1 check (views >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.doubt_votes (
  doubt_id text not null references public.doubts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (doubt_id, user_id)
);

create table if not exists public.bookmarks (
  doubt_id text not null references public.doubts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (doubt_id, user_id)
);

create table if not exists public.answers (
  id text primary key,
  doubt_id text not null references public.doubts(id) on delete cascade,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  is_anonymous boolean not null default false,
  is_best_answer boolean not null default false,
  is_verified_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists answers_one_best_per_doubt
  on public.answers (doubt_id) where is_best_answer;

create table if not exists public.answer_votes (
  answer_id text not null references public.answers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote text not null check (vote in ('upvote', 'correct', 'incorrect')),
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id, vote)
);

create table if not exists public.answer_comments (
  id text primary key,
  answer_id text not null references public.answers(id) on delete cascade,
  content text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id text primary key,
  target_type text not null check (target_type in ('doubt', 'answer')),
  target_id text not null,
  doubt_id text not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'fake_info', 'other')),
  details text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('new_answer', 'new_comment', 'best_answer', 'verified_correct', 'admin_alert')),
  title text not null,
  message text not null,
  link_doubt_id text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists doubts_created_at_idx on public.doubts (created_at desc);
create index if not exists answers_doubt_id_idx on public.answers (doubt_id, created_at);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.status = 'active' from public.profiles p where p.id = (select auth.uid())), false)
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_profile_role() in ('admin', 'faculty'), false)
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or new.email !~* '^[^[:space:]@]+@[^[:space:]@]+[.]ac[.]in$' then
    raise exception 'Use a college email address ending in .ac.in';
  end if;
  insert into public.profiles (
    id, full_name, role, requested_role, department, year, roll_number, avatar, is_verified
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'senior' then 'senior' else 'student' end,
    case when new.raw_user_meta_data ->> 'role' in ('faculty', 'admin')
      then new.raw_user_meta_data ->> 'role' else null end,
    coalesce(new.raw_user_meta_data ->> 'department', ''),
    coalesce(new.raw_user_meta_data ->> 'year', ''),
    coalesce(new.raw_user_meta_data ->> 'roll_number', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar', ''),
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.profiles set is_verified = new.email_confirmed_at is not null where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_auth_email_confirmation();

alter table public.profiles enable row level security;
alter table public.doubts enable row level security;
alter table public.doubt_votes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.answers enable row level security;
alter table public.answer_votes enable row level security;
alter table public.answer_comments enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Community doubts are readable" on public.doubts;
create policy "Community doubts are readable"
  on public.doubts for select to anon, authenticated using (true);

drop policy if exists "Community answers are readable" on public.answers;
create policy "Community answers are readable"
  on public.answers for select to anon, authenticated using (true);

drop policy if exists "Community comments are readable" on public.answer_comments;
create policy "Community comments are readable"
  on public.answer_comments for select to anon, authenticated using (true);

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Administrators can read reports" on public.reports;
drop policy if exists "Moderators can read reports" on public.reports;
create policy "Administrators can read reports"
  on public.reports for select to authenticated
  using (exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.status = 'active'
  ));

-- These views run as their postgres owner because direct access to base tables is revoked below.
create or replace view public.community_profiles as
select id, full_name, role, department, year, avatar, is_verified, reputation_points, created_at
from public.profiles;

create or replace view public.my_bookmarks as
select user_id, doubt_id from public.bookmarks where user_id = (select auth.uid());

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

alter view public.community_doubts set (security_invoker = false);
alter view public.community_answers set (security_invoker = false);
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

drop function if exists public.get_admin_profiles();
create function public.get_admin_profiles()
returns table (
  id uuid, email text, full_name text, role text, requested_role text, department text, year text,
  roll_number text, avatar text, status text, is_verified boolean,
  reputation_points integer, created_at timestamptz, saved_doubts text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() or coalesce(public.current_profile_role(), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  return query
    select p.id, u.email::text, p.full_name, p.role, p.requested_role, p.department, p.year,
      p.roll_number, p.avatar, p.status, p.is_verified, p.reputation_points,
      p.created_at,
      coalesce(array(select b.doubt_id from public.bookmarks b where b.user_id = p.id), '{}')
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

create or replace function public.review_role_request(p_user_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() or coalesce(public.current_profile_role(), '') <> 'admin' then
    raise exception 'Administrator access required';
  end if;
  update public.profiles
  set role = case when p_approve then requested_role else role end,
      requested_role = null
  where id = p_user_id and requested_role in ('faculty', 'admin');
  if not found then raise exception 'Pending staff access request not found'; end if;
end;
$$;

create or replace function public.update_my_profile(
  p_full_name text, p_department text, p_year text, p_roll_number text, p_avatar text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  update public.profiles
  set full_name = p_full_name, department = p_department, year = p_year,
      roll_number = p_roll_number, avatar = p_avatar
  where id = (select auth.uid());
  if not found then raise exception 'Profile not found'; end if;
end;
$$;

create or replace function public.create_doubt(p_id text, p_data jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare p public.profiles%rowtype;
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  select * into p from public.profiles where id = (select auth.uid());
  if not found or p.status <> 'active' then raise exception 'An active account is required'; end if;
  insert into public.doubts (
    id, title, content, author_id, is_anonymous, category, department,
    subject, semester, tags
  ) values (
    p_id, p_data ->> 'title', p_data ->> 'content', p.id,
    coalesce((p_data ->> 'isAnonymous')::boolean, false),
    p_data ->> 'category', p_data ->> 'department', p_data ->> 'subject',
    p_data ->> 'semester',
    coalesce(array(select jsonb_array_elements_text(p_data -> 'tags')), '{}')
  );
  update public.profiles set reputation_points = reputation_points + 5 where id = p.id;
  return p_id;
end;
$$;

create or replace function public.toggle_doubt_vote(p_doubt_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if (select auth.uid()) is null then raise exception 'Sign in to vote'; end if;
  delete from public.doubt_votes where doubt_id = p_doubt_id and user_id = (select auth.uid());
  if not found then
    insert into public.doubt_votes (doubt_id, user_id) values (p_doubt_id, (select auth.uid()));
  end if;
end;
$$;

create or replace function public.toggle_bookmark(p_doubt_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if (select auth.uid()) is null then raise exception 'Sign in to bookmark'; end if;
  delete from public.bookmarks where doubt_id = p_doubt_id and user_id = (select auth.uid());
  if not found then
    insert into public.bookmarks (doubt_id, user_id) values (p_doubt_id, (select auth.uid()));
    return true;
  end if;
  return false;
end;
$$;

create or replace function public.delete_doubt(p_doubt_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  delete from public.doubts d where d.id = p_doubt_id
    and (d.author_id = (select auth.uid()) or public.current_profile_role() = 'admin');
  if not found then raise exception 'Doubt not found or permission denied'; end if;
end;
$$;

create or replace function public.create_answer(p_id text, p_doubt_id text, p_content text, p_anonymous boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare p public.profiles%rowtype; question_author uuid;
begin
  select * into p from public.profiles where id = (select auth.uid());
  if not found or p.status <> 'active' then raise exception 'An active account is required'; end if;
  select author_id into question_author from public.doubts where id = p_doubt_id;
  if not found then raise exception 'Doubt not found'; end if;
  insert into public.answers (id, doubt_id, content, author_id, is_anonymous)
  values (p_id, p_doubt_id, p_content, p.id, p_anonymous);
  update public.profiles set reputation_points = reputation_points + 10 where id = p.id;
  if question_author <> p.id then
    insert into public.notifications (id, user_id, type, title, message, link_doubt_id)
    values (gen_random_uuid()::text, question_author, 'new_answer', 'New answer on your doubt',
      case when p_anonymous then 'An anonymous user answered your doubt.'
           else p.full_name || ' answered your doubt.' end, p_doubt_id);
  end if;
  return p_id;
end;
$$;

create or replace function public.toggle_answer_vote(p_answer_id text, p_vote text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare author uuid; removed integer;
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if p_vote not in ('upvote', 'correct', 'incorrect') then raise exception 'Invalid vote'; end if;
  if (select auth.uid()) is null then raise exception 'Sign in to vote'; end if;
  select author_id into author from public.answers where id = p_answer_id;
  if not found then raise exception 'Answer not found'; end if;
  delete from public.answer_votes where answer_id = p_answer_id
    and user_id = (select auth.uid()) and vote = p_vote;
  get diagnostics removed = row_count;
  if removed = 0 then
    if p_vote in ('correct', 'incorrect') then
      delete from public.answer_votes where answer_id = p_answer_id
        and user_id = (select auth.uid()) and vote in ('correct', 'incorrect');
    end if;
    insert into public.answer_votes (answer_id, user_id, vote)
      values (p_answer_id, (select auth.uid()), p_vote);
  end if;
  if p_vote = 'upvote' and author <> (select auth.uid()) then
    update public.profiles set reputation_points = greatest(0, reputation_points +
      case when removed = 0 then 5 else -5 end) where id = author;
  end if;
end;
$$;

create or replace function public.toggle_best_answer(p_answer_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.answers%rowtype; question_author uuid; was_best boolean;
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  select * into target from public.answers where id = p_answer_id;
  if not found then raise exception 'Answer not found'; end if;
  select author_id into question_author from public.doubts where id = target.doubt_id;
  if question_author <> (select auth.uid()) and not public.is_moderator() then
    raise exception 'Only the question author, faculty, or administrators can choose a best answer';
  end if;
  was_best := target.is_best_answer;
  update public.answers set is_best_answer = false where doubt_id = target.doubt_id and is_best_answer;
  if not was_best then
    update public.answers set is_best_answer = true where id = p_answer_id;
    update public.profiles set reputation_points = reputation_points + 25 where id = target.author_id;
    insert into public.notifications (id, user_id, type, title, message, link_doubt_id)
    values (gen_random_uuid()::text, target.author_id, 'best_answer', 'Best Answer Selected',
      'Your answer was marked as the best answer.', target.doubt_id);
  end if;
end;
$$;

create or replace function public.toggle_answer_verified(p_answer_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.answers%rowtype;
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if not public.is_moderator() then raise exception 'Faculty or administrator access required'; end if;
  update public.answers set is_verified_correct = not is_verified_correct, updated_at = now()
    where id = p_answer_id returning * into target;
  if not found then raise exception 'Answer not found'; end if;
  if target.is_verified_correct then
    update public.profiles set reputation_points = reputation_points + 50 where id = target.author_id;
    insert into public.notifications (id, user_id, type, title, message, link_doubt_id)
    values (gen_random_uuid()::text, target.author_id, 'verified_correct', 'Answer Verified Correct',
      'Faculty or an administrator verified your answer as correct.', target.doubt_id);
  end if;
end;
$$;

create or replace function public.add_answer_comment(p_id text, p_answer_id text, p_content text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.answers%rowtype; p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = (select auth.uid());
  if not found or p.status <> 'active' then raise exception 'An active account is required'; end if;
  select * into target from public.answers where id = p_answer_id;
  if not found then raise exception 'Answer not found'; end if;
  insert into public.answer_comments (id, answer_id, content, author_id)
  values (p_id, p_answer_id, p_content, p.id);
  if target.author_id <> p.id then
    insert into public.notifications (id, user_id, type, title, message, link_doubt_id)
    values (gen_random_uuid()::text, target.author_id, 'new_comment', 'New comment on your answer',
      p.full_name || ' commented on your answer.', target.doubt_id);
  end if;
end;
$$;

create or replace function public.delete_answer(p_answer_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  delete from public.answers a where a.id = p_answer_id
    and (a.author_id = (select auth.uid()) or public.current_profile_role() = 'admin'
      or exists (select 1 from public.doubts d where d.id = a.doubt_id and d.author_id = (select auth.uid())));
  if not found then raise exception 'Answer not found or permission denied'; end if;
end;
$$;

create or replace function public.submit_report(
  p_id text, p_target_type text, p_target_id text, p_doubt_id text, p_reason text, p_details text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if (select auth.uid()) is null then raise exception 'Sign in to report content'; end if;
  insert into public.reports (id, target_type, target_id, doubt_id, reporter_id, reason, details)
  values (p_id, p_target_type, p_target_id, p_doubt_id, (select auth.uid()), p_reason, p_details);
end;
$$;

create or replace function public.review_report(p_report_id text, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.reports%rowtype;
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if coalesce(public.current_profile_role(), '') <> 'admin' then raise exception 'Administrator access required'; end if;
  if p_action not in ('dismiss', 'remove_post') then raise exception 'Invalid moderation action'; end if;
  update public.reports set status = case when p_action = 'dismiss' then 'dismissed' else 'action_taken' end
    where id = p_report_id returning * into target;
  if not found then raise exception 'Report not found'; end if;
  if p_action = 'remove_post' then
    if target.target_type = 'doubt' then delete from public.doubts where id = target.target_id;
    else delete from public.answers where id = target.target_id; end if;
  end if;
end;
$$;

create or replace function public.update_user_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if coalesce(public.current_profile_role(), '') <> 'admin' then raise exception 'Administrator access required'; end if;
  if p_status not in ('active', 'suspended', 'blocked') then raise exception 'Invalid account status'; end if;
  update public.profiles set status = p_status where id = p_user_id;
  if not found then raise exception 'User not found'; end if;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_user() then raise exception 'An active account is required'; end if;
  if (select auth.uid()) is null then raise exception 'Sign in required'; end if;
  update public.notifications set is_read = true
    where user_id = (select auth.uid()) and (p_notification_id is null or id = p_notification_id);
end;
$$;

revoke all on public.profiles, public.doubts, public.doubt_votes, public.bookmarks,
  public.answers, public.answer_votes, public.answer_comments, public.reports, public.notifications
  from anon, authenticated;
revoke execute on function public.current_profile_role() from public, anon, authenticated;
revoke execute on function public.is_moderator() from public, anon, authenticated;
revoke execute on function public.is_active_user() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_auth_email_confirmation() from public, anon, authenticated;
revoke execute on function public.get_admin_profiles() from public, anon, authenticated;
revoke execute on function public.review_role_request(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.update_my_profile(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.create_doubt(text, jsonb) from public, anon, authenticated;
revoke execute on function public.toggle_doubt_vote(text) from public, anon, authenticated;
revoke execute on function public.toggle_bookmark(text) from public, anon, authenticated;
revoke execute on function public.delete_doubt(text) from public, anon, authenticated;
revoke execute on function public.create_answer(text, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.toggle_answer_vote(text, text) from public, anon, authenticated;
revoke execute on function public.toggle_best_answer(text) from public, anon, authenticated;
revoke execute on function public.toggle_answer_verified(text) from public, anon, authenticated;
revoke execute on function public.add_answer_comment(text, text, text) from public, anon, authenticated;
revoke execute on function public.delete_answer(text) from public, anon, authenticated;
revoke execute on function public.submit_report(text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.review_report(text, text) from public, anon, authenticated;
revoke execute on function public.update_user_status(uuid, text) from public, anon, authenticated;
revoke execute on function public.mark_notification_read(text) from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.community_profiles, public.community_doubts, public.community_answers to anon, authenticated;
grant select on public.my_bookmarks, public.admin_reports to authenticated;
grant select on public.profiles, public.notifications, public.reports to authenticated;
grant execute on function public.get_admin_profiles() to authenticated;
grant execute on function public.review_role_request(uuid, boolean) to authenticated;
grant execute on function public.update_my_profile(text, text, text, text, text) to authenticated;
grant execute on function public.create_doubt(text, jsonb) to authenticated;
grant execute on function public.toggle_doubt_vote(text) to authenticated;
grant execute on function public.toggle_bookmark(text) to authenticated;
grant execute on function public.delete_doubt(text) to authenticated;
grant execute on function public.create_answer(text, text, text, boolean) to authenticated;
grant execute on function public.toggle_answer_vote(text, text) to authenticated;
grant execute on function public.toggle_best_answer(text) to authenticated;
grant execute on function public.toggle_answer_verified(text) to authenticated;
grant execute on function public.add_answer_comment(text, text, text) to authenticated;
grant execute on function public.delete_answer(text) to authenticated;
grant execute on function public.submit_report(text, text, text, text, text, text) to authenticated;
grant execute on function public.review_report(text, text) to authenticated;
grant execute on function public.update_user_status(uuid, text) to authenticated;
grant execute on function public.mark_notification_read(text) to authenticated;
