-- Run after briefing-polls.sql as the database owner, against a development DB
-- or an explicitly approved target. Every test mutation is rolled back.
begin;

create or replace function pg_temp.expect_poll_error(
  p_token text, p_action text, p_payload jsonb, p_expected text
)
returns void
language plpgsql
as $$
declare v_message text;
begin
  begin
    perform public.briefing_poll_api(p_token, p_action, p_payload);
  exception when sqlstate 'P0001' then
    get stacked diagnostics v_message = message_text;
    if v_message = p_expected then return; end if;
    raise exception 'Expected %, received %', p_expected, v_message;
  end;
  raise exception 'Expected %, but the operation succeeded', p_expected;
end;
$$;

do $$
declare
  v_token constant text := 'verification-only-not-a-production-token-0123456789abcdef';
  v_poll jsonb;
  v_result jsonb;
  v_snapshot jsonb;
  v_id uuid;
  v_other_id uuid;
  v_title text := '[verification] AI poll ' || pg_catalog.txid_current()::text;
begin
  update briefing_private.settings set
    service_token_hash = pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(v_token, 'UTF8')), 'hex'),
    active_poll_id = null
    where singleton;

  perform pg_temp.expect_poll_error(null, 'list', '{}'::jsonb, 'poll_unauthorized');
  perform pg_temp.expect_poll_error('incorrect-token-0123456789abcdef0123456789', 'public', '{}'::jsonb, 'poll_unauthorized');
  perform pg_temp.expect_poll_error(v_token, 'unknown', '{}'::jsonb, 'invalid_poll');

  v_snapshot := public.briefing_poll_api(v_token, 'public');
  if v_snapshot -> 'poll' <> 'null'::jsonb or v_snapshot -> 'status' <> 'null'::jsonb
    or (v_snapshot #>> '{results,totalVoters}')::integer <> 0 then
    raise exception 'No active poll must return an empty public snapshot';
  end if;

  v_poll := pg_catalog.jsonb_build_object(
    'title', v_title, 'description', 'Anonymous test',
    'options', '[{"id":"a","label":"ChatGPT"},{"id":"b","label":"클로드"},{"id":"c","label":"기타"}]'::jsonb,
    'startsAt', pg_catalog.clock_timestamp() - interval '1 hour',
    'endsAt', pg_catalog.clock_timestamp() + interval '1 hour',
    'selectionMode', 'multiple', 'maxChoices', 2, 'enabled', false
  );
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"maxChoices":0}'::jsonb), 'invalid_poll');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || pg_catalog.jsonb_build_object('title', pg_catalog.repeat('가', 201))), 'invalid_poll');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"startsAt":"invalid"}'::jsonb), 'invalid_poll');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"endsAt":"infinity"}'::jsonb), 'invalid_poll');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"options":[{"id":"a","label":"same"},{"id":"b","label":"SAME"}]}'::jsonb), 'invalid_poll');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"options":[{"id":"a","label":"first"},{"id":"a","label":"second"}]}'::jsonb), 'invalid_poll');

  v_result := public.briefing_poll_api(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll));
  select entry into v_poll from pg_catalog.jsonb_array_elements(v_result -> 'polls') entry where entry ->> 'title' = v_title;
  v_id := (v_poll ->> 'id')::uuid;
  if v_id is null or (v_poll ->> 'revision')::integer <> 1 then raise exception 'Creating a draft failed'; end if;
  v_snapshot := public.briefing_poll_api(v_token, 'public');
  if v_snapshot -> 'poll' <> 'null'::jsonb then raise exception 'Draft poll leaked to public'; end if;

  v_result := public.briefing_poll_api(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"enabled":true}'::jsonb));
  select entry into v_poll from pg_catalog.jsonb_array_elements(v_result -> 'polls') entry where entry ->> 'id' = v_id::text;
  v_snapshot := public.briefing_poll_api(v_token, 'public');
  if v_snapshot ->> 'status' <> 'open' or v_snapshot #>> '{poll,id}' <> v_id::text
    or v_snapshot #> '{results,counts}' <> '{"a":0,"b":0,"c":0}'::jsonb then
    raise exception 'Published poll snapshot or empty counts are incorrect';
  end if;

  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('a',64), 'optionIds', '[]'::jsonb), 'invalid_vote');
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('a',64), 'optionIds', '["unknown"]'::jsonb), 'invalid_vote');
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('a',64), 'optionIds', '["a","a"]'::jsonb), 'invalid_vote');
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('a',64), 'optionIds', '["a","b","c"]'::jsonb), 'invalid_vote');
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', 'not-a-hash', 'optionIds', '["a"]'::jsonb), 'invalid_vote');

  v_snapshot := public.briefing_poll_api(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('a',64), 'optionIds', '["a","b"]'::jsonb));
  if v_snapshot ->> 'voted' <> 'true' or (v_snapshot #>> '{results,totalVoters}')::integer <> 1
    or (v_snapshot #>> '{results,totalSelections}')::integer <> 2 then
    raise exception 'Successful vote must immediately return its committed aggregate';
  end if;
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('a',64), 'optionIds', '["c"]'::jsonb), 'already_voted');
  v_snapshot := public.briefing_poll_api(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('b',64), 'optionIds', '["b"]'::jsonb));
  if (v_snapshot #>> '{results,totalVoters}')::integer <> 2
    or (v_snapshot #>> '{results,totalSelections}')::integer <> 3
    or v_snapshot #> '{results,counts}' <> '{"a":1,"b":2,"c":0}'::jsonb then
    raise exception 'Vote totals, duplicate rejection or zero-count options are incorrect';
  end if;
  if v_snapshot::text like '%voterHash%' or v_snapshot::text like '%voter_hash%' then
    raise exception 'The public snapshot must never contain ballot identities';
  end if;

  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"revision":1}'::jsonb), 'revision_conflict');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"title":"Different question"}'::jsonb), 'poll_locked');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"selectionMode":"single","maxChoices":1}'::jsonb), 'poll_locked');
  perform pg_temp.expect_poll_error(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"options":[{"id":"a","label":"Changed"},{"id":"b","label":"클로드"},{"id":"c","label":"기타"}]}'::jsonb), 'poll_locked');

  v_result := public.briefing_poll_api(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || pg_catalog.jsonb_build_object(
    'description', 'Edited description', 'endsAt', pg_catalog.clock_timestamp() - interval '1 minute'
  )));
  select entry into v_poll from pg_catalog.jsonb_array_elements(v_result -> 'polls') entry where entry ->> 'id' = v_id::text;
  v_snapshot := public.briefing_poll_api(v_token, 'public');
  if v_snapshot ->> 'status' <> 'closed' or (v_snapshot #>> '{results,totalVoters}')::integer <> 2 then
    raise exception 'Closed poll must retain results';
  end if;
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('c',64), 'optionIds', '["a"]'::jsonb), 'poll_closed');

  v_result := public.briefing_poll_api(v_token, 'save', pg_catalog.jsonb_build_object('poll', (v_poll - 'id' - 'revision' - 'results') || pg_catalog.jsonb_build_object(
    'title', v_title || ' scheduled', 'startsAt', pg_catalog.clock_timestamp() + interval '1 hour',
    'endsAt', pg_catalog.clock_timestamp() + interval '2 hours', 'selectionMode', 'single', 'maxChoices', 1
  )));
  v_other_id := (v_result ->> 'activePollId')::uuid;
  if v_other_id = v_id then raise exception 'New poll must get an independent identity'; end if;
  if (select pg_catalog.count(*) from briefing_private.polls where enabled) <> 1 then raise exception 'Only one poll may be enabled'; end if;
  v_snapshot := public.briefing_poll_api(v_token, 'public');
  if v_snapshot ->> 'status' <> 'scheduled' then raise exception 'Future poll must be scheduled'; end if;
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_other_id, 'voterHash', pg_catalog.repeat('c',64), 'optionIds', '["a"]'::jsonb), 'poll_closed');
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_id, 'voterHash', pg_catalog.repeat('c',64), 'optionIds', '["a"]'::jsonb), 'poll_closed');

  select entry into v_poll from pg_catalog.jsonb_array_elements(v_result -> 'polls') entry where entry ->> 'id' = v_other_id::text;
  v_result := public.briefing_poll_api(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || pg_catalog.jsonb_build_object('startsAt', pg_catalog.clock_timestamp() - interval '1 minute')));
  select entry into v_poll from pg_catalog.jsonb_array_elements(v_result -> 'polls') entry where entry ->> 'id' = v_other_id::text;
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_other_id, 'voterHash', pg_catalog.repeat('c',64), 'optionIds', '["a","b"]'::jsonb), 'invalid_vote');
  v_snapshot := public.briefing_poll_api(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_other_id, 'voterHash', pg_catalog.repeat('c',64), 'optionIds', '["c"]'::jsonb));
  if (v_snapshot #>> '{results,totalSelections}')::integer <> 1 then raise exception 'Single-choice vote failed'; end if;

  perform public.briefing_poll_api(v_token, 'save', pg_catalog.jsonb_build_object('poll', v_poll || '{"enabled":false}'::jsonb));
  v_snapshot := public.briefing_poll_api(v_token, 'public');
  if v_snapshot -> 'poll' <> 'null'::jsonb then raise exception 'Disabled active poll must be hidden'; end if;
  perform pg_temp.expect_poll_error(v_token, 'vote', pg_catalog.jsonb_build_object('pollId', v_other_id, 'voterHash', pg_catalog.repeat('d',64), 'optionIds', '["a"]'::jsonb), 'poll_closed');

  if pg_catalog.has_schema_privilege('anon', 'briefing_private', 'USAGE')
    or pg_catalog.has_schema_privilege('authenticated', 'briefing_private', 'USAGE')
    or pg_catalog.has_table_privilege('anon', 'briefing_private.ballots', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'briefing_private.ballots', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'briefing_private.polls', 'INSERT')
    or pg_catalog.has_function_privilege('anon', 'briefing_private.poll_admin_snapshot()', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.briefing_poll_api(text,text,jsonb)', 'EXECUTE') then
    raise exception 'Private schema/table/helper permissions are incorrect';
  end if;
  if exists (
    select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'briefing_private' and c.relkind = 'r' and not c.relrowsecurity
  ) then raise exception 'Every private poll table must have RLS enabled'; end if;
  raise notice 'PASS: anonymous poll creation, voting, periods, edits, aggregates and permissions';
end;
$$;

-- The actual API role can invoke the RPC with the server-held token only.
set local role anon;
select public.briefing_poll_api('verification-only-not-a-production-token-0123456789abcdef', 'public');
reset role;

rollback;
