-- Anonymous Daily Briefing polls. Run as the database owner.
-- The Data API exposes only the token-protected RPC below. The admin server holds
-- POLL_SERVICE_TOKEN; the browser never receives it or reads individual ballots.
-- Provision settings.service_token_hash separately with a random >=256-bit token.
-- No application, authentication, or user tables outside this schema are changed.

create schema if not exists briefing_private;
revoke all on schema briefing_private from public, anon, authenticated;
alter default privileges in schema briefing_private revoke execute on functions from public;

create or replace function briefing_private.valid_options(p_options jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when pg_catalog.jsonb_typeof(p_options) is distinct from 'array' then false
    when pg_catalog.jsonb_array_length(p_options) not between 2 and 10 then false
    else (
      select pg_catalog.bool_and(
        pg_catalog.jsonb_typeof(option) = 'object'
        and pg_catalog.jsonb_typeof(option -> 'id') = 'string'
        and (option ->> 'id') ~ '^[A-Za-z0-9_-]{1,64}$'
        and pg_catalog.jsonb_typeof(option -> 'label') = 'string'
        and pg_catalog.length(pg_catalog.btrim(option ->> 'label')) between 1 and 160
      ) is true
      and pg_catalog.count(distinct option ->> 'id') = pg_catalog.count(*)
      and pg_catalog.count(distinct pg_catalog.lower(pg_catalog.btrim(option ->> 'label'))) = pg_catalog.count(*)
      from pg_catalog.jsonb_array_elements(p_options) as options(option)
    )
  end;
$$;

create table if not exists briefing_private.polls (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  title text not null check (pg_catalog.length(pg_catalog.btrim(title)) between 1 and 200),
  description text not null default '' check (pg_catalog.length(description) <= 2000),
  options jsonb not null check (briefing_private.valid_options(options)),
  starts_at timestamptz not null check (pg_catalog.isfinite(starts_at)),
  ends_at timestamptz not null check (pg_catalog.isfinite(ends_at) and ends_at > starts_at),
  selection_mode text not null check (selection_mode in ('single', 'multiple')),
  max_choices integer not null check (max_choices between 1 and 10),
  enabled boolean not null default false,
  revision integer not null default 1 check (revision >= 1),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  check (max_choices <= pg_catalog.jsonb_array_length(options)),
  check (selection_mode <> 'single' or max_choices = 1)
);

create table if not exists briefing_private.settings (
  singleton boolean primary key default true check (singleton),
  service_token_hash text check (service_token_hash ~ '^[0-9a-f]{64}$'),
  active_poll_id uuid references briefing_private.polls(id) on delete set null
);
insert into briefing_private.settings(singleton) values (true) on conflict do nothing;

create table if not exists briefing_private.ballots (
  poll_id uuid not null references briefing_private.polls(id) on delete restrict,
  voter_hash text not null check (voter_hash ~ '^[0-9a-f]{64}$'),
  option_ids text[] not null check (pg_catalog.cardinality(option_ids) between 1 and 10),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (poll_id, voter_hash)
);

alter table briefing_private.polls enable row level security;
alter table briefing_private.settings enable row level security;
alter table briefing_private.ballots enable row level security;
revoke all on all tables in schema briefing_private from public, anon, authenticated;

create or replace function briefing_private.poll_results(p_poll_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ballot_totals as (
    select pg_catalog.count(*) as voters,
      coalesce(pg_catalog.sum(pg_catalog.cardinality(b.option_ids)), 0) as selections
    from briefing_private.ballots b where b.poll_id = p_poll_id
  ), choice_counts as (
    select choice.id, pg_catalog.count(*) as votes
    from briefing_private.ballots b
    cross join lateral pg_catalog.unnest(b.option_ids) as choice(id)
    where b.poll_id = p_poll_id
    group by choice.id
  ), all_counts as (
    select pg_catalog.jsonb_object_agg(option ->> 'id', coalesce(c.votes, 0)) as counts
    from briefing_private.polls p
    cross join lateral pg_catalog.jsonb_array_elements(p.options) as options(option)
    left join choice_counts c on c.id = option ->> 'id'
    where p.id = p_poll_id
  )
  select pg_catalog.jsonb_build_object(
    'totalVoters', ballot_totals.voters,
    'totalSelections', ballot_totals.selections,
    'counts', coalesce(all_counts.counts, '{}'::jsonb)
  ) from ballot_totals cross join all_counts;
$$;

create or replace function briefing_private.poll_public_snapshot()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_poll briefing_private.polls%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  select p.* into v_poll
  from briefing_private.polls p
  join briefing_private.settings s on s.active_poll_id = p.id
  where s.singleton and p.enabled;
  if not found then
    return pg_catalog.jsonb_build_object(
      'poll', null, 'status', null,
      'results', pg_catalog.jsonb_build_object('totalVoters', 0, 'totalSelections', 0, 'counts', '{}'::jsonb),
      'serverTime', v_now
    );
  end if;
  return pg_catalog.jsonb_build_object(
    'poll', pg_catalog.jsonb_build_object(
      'id', v_poll.id, 'title', v_poll.title, 'description', v_poll.description,
      'options', v_poll.options, 'startsAt', v_poll.starts_at, 'endsAt', v_poll.ends_at,
      'selectionMode', v_poll.selection_mode, 'maxChoices', v_poll.max_choices
    ),
    'status', case when v_now < v_poll.starts_at then 'scheduled'
                   when v_now >= v_poll.ends_at then 'closed' else 'open' end,
    'results', briefing_private.poll_results(v_poll.id),
    'serverTime', v_now
  );
end;
$$;

create or replace function briefing_private.poll_admin_snapshot()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'polls', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'id', p.id, 'title', p.title, 'description', p.description, 'options', p.options,
        'startsAt', p.starts_at, 'endsAt', p.ends_at, 'selectionMode', p.selection_mode,
        'maxChoices', p.max_choices, 'enabled', p.enabled, 'revision', p.revision,
        'createdAt', p.created_at, 'updatedAt', p.updated_at,
        'results', briefing_private.poll_results(p.id)
      ) order by p.created_at desc, p.id)
      from briefing_private.polls p
    ), '[]'::jsonb),
    'activePollId', (select s.active_poll_id from briefing_private.settings s where s.singleton)
  );
$$;

create or replace function public.briefing_poll_api(
  p_token text,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_hash text;
  v_input jsonb;
  v_poll briefing_private.polls%rowtype;
  v_id uuid;
  v_current uuid;
  v_title text;
  v_description text;
  v_options jsonb;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_mode text;
  v_max integer;
  v_enabled boolean;
  v_revision integer;
  v_voter_hash text;
  v_option_ids text[];
  v_now timestamptz;
begin
  select s.service_token_hash into v_expected_hash from briefing_private.settings s where s.singleton;
  if p_token is null or pg_catalog.length(p_token) not between 32 and 512
    or v_expected_hash is null
    or pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p_token, 'UTF8')), 'hex') <> v_expected_hash then
    raise exception using message = 'poll_unauthorized', errcode = 'P0001';
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object'
    or pg_catalog.octet_length(p_payload::text) > 32768 then
    raise exception using message = 'invalid_poll', errcode = 'P0001';
  end if;

  if p_action = 'public' then
    return briefing_private.poll_public_snapshot();
  elsif p_action = 'list' then
    return briefing_private.poll_admin_snapshot();
  elsif p_action = 'vote' then
    if pg_catalog.jsonb_typeof(p_payload -> 'pollId') is distinct from 'string'
      or (p_payload ->> 'pollId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or pg_catalog.jsonb_typeof(p_payload -> 'voterHash') is distinct from 'string'
      or (p_payload ->> 'voterHash') !~ '^[0-9a-f]{64}$'
      or pg_catalog.jsonb_typeof(p_payload -> 'optionIds') is distinct from 'array' then
      raise exception using message = 'invalid_vote', errcode = 'P0001';
    end if;
    if pg_catalog.jsonb_array_length(p_payload -> 'optionIds') not between 1 and 10
      or exists (select 1 from pg_catalog.jsonb_array_elements(p_payload -> 'optionIds') x where pg_catalog.jsonb_typeof(x) <> 'string') then
      raise exception using message = 'invalid_vote', errcode = 'P0001';
    end if;
    v_id := (p_payload ->> 'pollId')::uuid;
    v_voter_hash := p_payload ->> 'voterHash';
    select pg_catalog.array_agg(x) into v_option_ids
      from pg_catalog.jsonb_array_elements_text(p_payload -> 'optionIds') x;

    -- This row lock serializes votes and settings edits for this poll. It also
    -- prevents a late request from slipping through while an admin closes it.
    select p.* into v_poll from briefing_private.polls p where p.id = v_id for update;
    if not found then raise exception using message = 'poll_closed', errcode = 'P0001'; end if;
    select s.active_poll_id into v_current from briefing_private.settings s where s.singleton;
    v_now := pg_catalog.clock_timestamp();
    if not v_poll.enabled or v_current is distinct from v_id or v_now < v_poll.starts_at or v_now >= v_poll.ends_at then
      raise exception using message = 'poll_closed', errcode = 'P0001';
    end if;
    if pg_catalog.cardinality(v_option_ids) > v_poll.max_choices
      or (v_poll.selection_mode = 'single' and pg_catalog.cardinality(v_option_ids) <> 1)
      or (select pg_catalog.count(distinct x) from pg_catalog.unnest(v_option_ids) x) <> pg_catalog.cardinality(v_option_ids)
      or exists (
        select 1 from pg_catalog.unnest(v_option_ids) x
        where not exists (select 1 from pg_catalog.jsonb_array_elements(v_poll.options) o where o ->> 'id' = x)
      ) then
      raise exception using message = 'invalid_vote', errcode = 'P0001';
    end if;
    if exists (select 1 from briefing_private.ballots b where b.poll_id = v_id and b.voter_hash = v_voter_hash) then
      raise exception using message = 'already_voted', errcode = 'P0001';
    end if;
    insert into briefing_private.ballots(poll_id, voter_hash, option_ids, created_at)
      values (v_id, v_voter_hash, v_option_ids, v_now);
    return briefing_private.poll_public_snapshot() || pg_catalog.jsonb_build_object('voted', true);

  elsif p_action = 'save' then
    v_input := p_payload -> 'poll';
    if pg_catalog.jsonb_typeof(v_input) is distinct from 'object'
      or pg_catalog.jsonb_typeof(v_input -> 'title') is distinct from 'string'
      or pg_catalog.jsonb_typeof(v_input -> 'description') is distinct from 'string'
      or pg_catalog.jsonb_typeof(v_input -> 'startsAt') is distinct from 'string'
      or pg_catalog.jsonb_typeof(v_input -> 'endsAt') is distinct from 'string'
      or pg_catalog.jsonb_typeof(v_input -> 'selectionMode') is distinct from 'string'
      or pg_catalog.jsonb_typeof(v_input -> 'enabled') is distinct from 'boolean'
      or pg_catalog.jsonb_typeof(v_input -> 'maxChoices') is distinct from 'number'
      or (v_input ->> 'maxChoices') !~ '^[1-9][0-9]?$'
      or not briefing_private.valid_options(v_input -> 'options') then
      raise exception using message = 'invalid_poll', errcode = 'P0001';
    end if;
    v_title := pg_catalog.btrim(v_input ->> 'title');
    v_description := v_input ->> 'description';
    v_mode := v_input ->> 'selectionMode';
    v_max := (v_input ->> 'maxChoices')::integer;
    v_enabled := (v_input ->> 'enabled')::boolean;
    -- Canonical option objects prevent extra input properties from entering API responses.
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id', o ->> 'id', 'label', pg_catalog.btrim(o ->> 'label')) order by ordinal)
      into v_options from pg_catalog.jsonb_array_elements(v_input -> 'options') with ordinality as options(o, ordinal);
    begin
      v_starts_at := (v_input ->> 'startsAt')::timestamptz;
      v_ends_at := (v_input ->> 'endsAt')::timestamptz;
    exception when others then
      raise exception using message = 'invalid_poll', errcode = 'P0001';
    end;
    if pg_catalog.length(v_title) not between 1 and 200 or pg_catalog.length(v_description) > 2000
      or v_mode not in ('single', 'multiple') or v_max not between 1 and pg_catalog.jsonb_array_length(v_options)
      or (v_mode = 'single' and v_max <> 1)
      or not pg_catalog.isfinite(v_starts_at) or not pg_catalog.isfinite(v_ends_at)
      or v_ends_at <= v_starts_at then
      raise exception using message = 'invalid_poll', errcode = 'P0001';
    end if;

    -- All admin saves acquire the singleton first, then poll rows. Votes never
    -- lock settings, so publishing a different poll cannot create a lock cycle.
    select s.active_poll_id into v_current from briefing_private.settings s where s.singleton for update;
    if v_input ? 'id' then
      if pg_catalog.jsonb_typeof(v_input -> 'id') is distinct from 'string'
        or (v_input ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or pg_catalog.jsonb_typeof(v_input -> 'revision') is distinct from 'number'
        or (v_input ->> 'revision') !~ '^[1-9][0-9]{0,8}$' then
        raise exception using message = 'invalid_poll', errcode = 'P0001';
      end if;
      v_id := (v_input ->> 'id')::uuid;
      v_revision := (v_input ->> 'revision')::integer;
      select p.* into v_poll from briefing_private.polls p where p.id = v_id for update;
      if not found then raise exception using message = 'invalid_poll', errcode = 'P0001'; end if;
      if v_poll.revision <> v_revision then raise exception using message = 'revision_conflict', errcode = 'P0001'; end if;
      if (v_poll.title <> v_title or v_poll.options <> v_options or v_poll.selection_mode <> v_mode or v_poll.max_choices <> v_max)
        and exists (select 1 from briefing_private.ballots b where b.poll_id = v_id) then
        raise exception using message = 'poll_locked', errcode = 'P0001';
      end if;
      update briefing_private.polls set title = v_title, description = v_description, options = v_options,
        starts_at = v_starts_at, ends_at = v_ends_at, selection_mode = v_mode, max_choices = v_max,
        enabled = v_enabled, revision = revision + 1, updated_at = pg_catalog.clock_timestamp()
        where id = v_id;
    else
      insert into briefing_private.polls(title, description, options, starts_at, ends_at, selection_mode, max_choices, enabled)
        values (v_title, v_description, v_options, v_starts_at, v_ends_at, v_mode, v_max, v_enabled)
        returning id into v_id;
    end if;
    if v_enabled then
      update briefing_private.polls set enabled = false, revision = revision + 1, updated_at = pg_catalog.clock_timestamp()
        where enabled and id <> v_id;
      update briefing_private.settings set active_poll_id = v_id where singleton;
    elsif v_current = v_id then
      update briefing_private.settings set active_poll_id = null where singleton;
    end if;
    return briefing_private.poll_admin_snapshot();
  end if;
  raise exception using message = 'invalid_poll', errcode = 'P0001';
end;
$$;

revoke all on all functions in schema briefing_private from public, anon, authenticated;
revoke all on function public.briefing_poll_api(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.briefing_poll_api(text, text, jsonb) to anon;

comment on function public.briefing_poll_api(text, text, jsonb) is
  'Server-only Daily Briefing poll API. Requires the dedicated POLL_SERVICE_TOKEN; no raw ballot read operation.';
