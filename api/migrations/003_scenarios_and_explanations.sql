-- Apply after 002_rls_rpc_hardening.sql.
-- Every calculated scenario receives an owner-scoped ID. Only explicitly
-- saved scenarios require Pro; the ID supplies the TRD explanation endpoint.

create or replace function public.create_scenario(
  p_start date,
  p_end date,
  p_reductions jsonb,
  p_save boolean default false,
  p_name text default null
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  calculated jsonb;
  created public.scenarios%rowtype;
  normalized_name text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_save and not exists (
    select 1 from public.pro_entitlements
    where user_id = auth.uid() and expires_at > now()
  ) then
    raise exception 'pro_required' using errcode = '42501';
  end if;

  select public.calculate_scenario(p_start, p_end, p_reductions) into calculated;
  if calculated ? 'error' then
    return calculated;
  end if;

  normalized_name := nullif(btrim(coalesce(p_name, '')), '');
  if p_save and normalized_name is null then
    normalized_name := 'Plan for ' || to_char(p_start, 'YYYY-MM');
  end if;

  insert into public.scenarios (user_id, data_revision, input, result)
  values (
    auth.uid(),
    calculated->>'data_revision',
    jsonb_build_object(
      'range', calculated->'range', 'cuts', p_reductions,
      'saved', p_save, 'name', normalized_name
    ),
    calculated
  ) returning * into created;

  return calculated || jsonb_build_object(
    'id', created.id, 'saved', p_save,
    'name', normalized_name, 'created_at', created.created_at, 'stale', false
  );
end;
$$;

create or replace function public.list_saved_scenarios()
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(
    scenario.result || jsonb_build_object(
      'id', scenario.id,
      'saved', true,
      'name', scenario.input->>'name',
      'created_at', scenario.created_at,
      'stale', scenario.data_revision <> (
        public.get_analysis(
          (scenario.result->'range'->>'start')::date,
          (scenario.result->'range'->>'end')::date
        )->>'data_revision'
      )
    ) order by scenario.created_at desc
  ), '[]'::jsonb)
  from public.scenarios scenario
  where scenario.user_id = auth.uid()
    and coalesce((scenario.input->>'saved')::boolean, false);
$$;

create or replace function public.get_scenario(p_scenario_id uuid)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select scenario.result
  from public.scenarios scenario
  where scenario.id = p_scenario_id and scenario.user_id = auth.uid();
$$;

revoke execute on function public.create_scenario(date, date, jsonb, boolean, text) from public;
revoke execute on function public.list_saved_scenarios() from public;
revoke execute on function public.get_scenario(uuid) from public;
grant execute on function public.create_scenario(date, date, jsonb, boolean, text) to authenticated;
grant execute on function public.list_saved_scenarios() to authenticated;
grant execute on function public.get_scenario(uuid) to authenticated;
