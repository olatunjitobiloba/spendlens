-- SpendLens v1 schema. Run in Supabase SQL editor or the Supabase migration runner.
create extension if not exists pgcrypto;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null,
  currency text not null default 'NGN' check (currency = 'NGN'),
  unique (user_id, alias)
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  content_hash text not null,
  idempotency_key text not null,
  period_start date,
  period_end date,
  parser_version text not null default 'v1',
  created_at timestamptz not null default now(),
  unique (user_id, content_hash),
  unique (user_id, idempotency_key)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  source_row integer not null,
  txn_date date not null,
  txn_time time,
  description text not null,
  amount_kobo bigint not null check (amount_kobo > 0),
  direction text not null check (direction in ('debit', 'credit')),
  bank text not null default 'other',
  account_alias text not null,
  reference text,
  category text,
  category_source text,
  category_confidence numeric,
  review_state text not null default 'unreviewed',
  status text not null default 'OK',
  unique (import_id, source_row)
);
create index transactions_user_date_idx on public.transactions (user_id, txn_date);

create table public.reconciliation_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('duplicate', 'internal_transfer')),
  txn_ids uuid[] not null,
  state text not null default 'candidate' check (state in ('candidate', 'confirmed', 'rejected'))
);

create table public.protections (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  primary key (user_id, category)
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data_revision text not null,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table public.billing_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  amount_kobo bigint not null check (amount_kobo > 0),
  idempotency_key text not null,
  paid_amount_kobo bigint,
  currency text not null check (currency = 'NGN'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'underpaid', 'overpaid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
  , unique (user_id, idempotency_key)
);

create table public.pro_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_hash text not null unique,
  event_type text,
  received_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.imports enable row level security;
alter table public.transactions enable row level security;
alter table public.reconciliation_links enable row level security;
alter table public.protections enable row level security;
alter table public.scenarios enable row level security;
alter table public.billing_orders enable row level security;
alter table public.pro_entitlements enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_events enable row level security;

create policy accounts_owner on public.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy imports_owner on public.imports for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy transactions_owner on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reconciliation_links_owner on public.reconciliation_links for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy protections_owner on public.protections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy scenarios_owner on public.scenarios for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Billing, webhook, and audit rows have no client policies: only backend service-role work may modify them.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.accounts, public.imports, public.transactions,
  public.reconciliation_links, public.protections, public.scenarios to authenticated;

create or replace function public.commit_import(
  p_content_hash text,
  p_idempotency_key text,
  p_transactions jsonb,
  p_duplicate_candidates jsonb,
  p_period_start date,
  p_period_end date
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  existing public.imports%rowtype;
  created_import public.imports%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into existing from public.imports
  where user_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then
    if existing.content_hash <> p_content_hash then
      raise exception 'idempotency key was used for different content';
    end if;
    return jsonb_build_object('id', existing.id, 'reused', true);
  end if;

  select * into existing from public.imports
  where user_id = auth.uid() and content_hash = p_content_hash;
  if found then
    return jsonb_build_object('id', existing.id, 'reused', true);
  end if;

  insert into public.imports (user_id, content_hash, idempotency_key, period_start, period_end)
  values (auth.uid(), p_content_hash, p_idempotency_key, p_period_start, p_period_end)
  returning * into created_import;

  insert into public.transactions (
    user_id, import_id, source_row, txn_date, txn_time, description, amount_kobo,
    direction, bank, account_alias, reference, category, category_source,
    category_confidence, status
  )
  select auth.uid(), created_import.id, row.source_row, row.txn_date, row.txn_time,
    row.description, row.amount_kobo, row.direction, row.bank, row.account_alias,
    row.reference, row.category, 'rule', row.category_confidence, row.status
  from jsonb_to_recordset(p_transactions) as row(
    source_row integer, txn_date date, txn_time time, description text, amount_kobo bigint,
    direction text, bank text, account_alias text, reference text, category text,
    category_confidence numeric, status text
  );

  insert into public.reconciliation_links (user_id, kind, txn_ids)
  select auth.uid(), candidate.kind, array(
    select transaction.id
    from public.transactions as transaction
    where transaction.import_id = created_import.id
      and transaction.source_row = any(candidate.txn_source_rows)
    order by transaction.source_row
  )
  from jsonb_to_recordset(p_duplicate_candidates) as candidate(
    kind text, txn_source_rows integer[]
  );

  return jsonb_build_object('id', created_import.id, 'reused', false);
end;
$$;

grant execute on function public.commit_import(text, text, jsonb, jsonb, date, date) to authenticated;

create or replace function public.set_reconciliation_state(
  p_candidate_id uuid,
  p_state text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  candidate public.reconciliation_links%rowtype;
begin
  if p_state not in ('confirmed', 'rejected') then
    raise exception 'invalid reconciliation state';
  end if;
  update public.reconciliation_links
  set state = p_state
  where id = p_candidate_id and user_id = auth.uid()
  returning * into candidate;
  if not found then
    raise exception 'candidate not found';
  end if;
  return jsonb_build_object('id', candidate.id, 'state', candidate.state);
end;
$$;

grant execute on function public.set_reconciliation_state(uuid, text) to authenticated;

create or replace function public.set_protections(p_categories text[])
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.protections where user_id = auth.uid();
  insert into public.protections (user_id, category)
  select auth.uid(), category from unnest(p_categories) as category;
  return jsonb_build_object('categories', coalesce(to_jsonb(p_categories), '[]'::jsonb));
end;
$$;

create or replace function public.get_analysis(p_start date, p_end date)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  with eligible as (
    select t.*
    from public.transactions t
    where t.user_id = auth.uid()
      and t.txn_date between p_start and p_end
      and t.direction = 'debit'
      and coalesce(t.category, 'Uncategorized') not in (
        select category from public.protections where user_id = auth.uid()
      )
      and not exists (
        select 1 from public.reconciliation_links link
        where link.user_id = auth.uid()
          and link.state = 'confirmed'
          and t.id = any(link.txn_ids)
      )
  ), category_rows as (
    select coalesce(category, 'Uncategorized') as category, sum(amount_kobo)::bigint as total_kobo
    from eligible group by coalesce(category, 'Uncategorized')
  ), candidate_count as (
    select count(*)::integer as count
    from eligible t
    where exists (
      select 1 from public.reconciliation_links link
      where link.user_id = auth.uid() and link.state = 'candidate' and t.id = any(link.txn_ids)
    )
  ), revision_source as (
    select coalesce(string_agg(value, '|' order by value), '') as value
    from (
      select concat_ws(':', t.id, t.txn_date, t.amount_kobo, t.direction, t.category, t.review_state, t.status) as value
      from public.transactions t where t.user_id = auth.uid()
      union all
      select concat_ws(':', link.id, link.kind, link.state, link.txn_ids::text) as value
      from public.reconciliation_links link where link.user_id = auth.uid()
    ) revisions
  )
  select jsonb_build_object(
    'data_revision',
    encode(extensions.digest((select value from revision_source), 'sha256'), 'hex'),
    'range', jsonb_build_object('start', p_start, 'end', p_end),
    'baseline_kobo', coalesce((select sum(amount_kobo)::bigint from eligible), 0),
    'categories', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'total_kobo', total_kobo) order by total_kobo desc) from category_rows), '[]'::jsonb),
    'coverage_warnings', (
      select coalesce(jsonb_agg(message), '[]'::jsonb) from (
        select 'No transactions in this range' as message where not exists (select 1 from eligible)
        union all
        select 'Limited transaction history' where (select count(*) from eligible) between 1 and 2
        union all
        select (select count::text || ' transactions need review' from candidate_count) where (select count from candidate_count) > 0
      ) warnings
    )
  );
$$;

create or replace function public.calculate_scenario(
  p_start date,
  p_end date,
  p_reductions jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  analysis jsonb;
  protected text[];
begin
  select coalesce(array_agg(category), '{}') into protected
  from public.protections where user_id = auth.uid();
  if exists (
    select 1 from jsonb_to_recordset(p_reductions) as reduction(category text, percent integer)
    where reduction.category = any(protected)
  ) then
    return jsonb_build_object('error', 'protected_category');
  end if;

  select public.get_analysis(p_start, p_end) into analysis;
  return jsonb_build_object(
    'data_revision', analysis->'data_revision',
    'range', analysis->'range',
    'baseline_kobo', analysis->'baseline_kobo',
    'categories', (
      with requested as (
        select category, percent from jsonb_to_recordset(p_reductions) as reduction(category text, percent integer)
      ), totals as (
        select category, total_kobo from jsonb_to_recordset(analysis->'categories') as row(category text, total_kobo bigint)
      )
      select coalesce(jsonb_agg(jsonb_build_object(
        'category', requested.category,
        'total_kobo', coalesce(totals.total_kobo, 0),
        'percent', requested.percent,
        'reduction_kobo', coalesce(totals.total_kobo, 0) * requested.percent / 100
      ) order by requested.category), '[]'::jsonb)
      from requested left join totals using (category)
    ),
    'total_reduction_kobo', (
      with requested as (
        select category, percent from jsonb_to_recordset(p_reductions) as reduction(category text, percent integer)
      ), totals as (
        select category, total_kobo from jsonb_to_recordset(analysis->'categories') as row(category text, total_kobo bigint)
      )
      select coalesce(sum(coalesce(totals.total_kobo, 0) * requested.percent / 100), 0)
      from requested left join totals using (category)
    ),
    'remaining_kobo', (
      with requested as (
        select category, percent from jsonb_to_recordset(p_reductions) as reduction(category text, percent integer)
      ), totals as (
        select category, total_kobo from jsonb_to_recordset(analysis->'categories') as row(category text, total_kobo bigint)
      )
      select (analysis->>'baseline_kobo')::bigint - coalesce(sum(coalesce(totals.total_kobo, 0) * requested.percent / 100), 0)
      from requested left join totals using (category)
    ),
    'protected_categories', to_jsonb(protected),
    'coverage_warnings', analysis->'coverage_warnings',
    'evidence_txn_ids', (
      select coalesce(jsonb_agg(id), '[]'::jsonb) from (
        select t.id from public.transactions t
        where t.user_id = auth.uid() and t.txn_date between p_start and p_end and t.direction = 'debit'
          and coalesce(t.category, 'Uncategorized') not in (
            select category from public.protections where user_id = auth.uid()
          )
          and not exists (
            select 1 from public.reconciliation_links link
            where link.user_id = auth.uid() and link.state = 'confirmed' and t.id = any(link.txn_ids)
          )
          and coalesce(t.category, 'Uncategorized') in (
            select category from jsonb_to_recordset(p_reductions) as reduction(category text, percent integer)
          )
        order by t.amount_kobo desc limit 10
      ) evidence
    )
  );
end;
$$;

grant execute on function public.set_protections(text[]) to authenticated;
grant execute on function public.get_analysis(date, date) to authenticated;
grant execute on function public.calculate_scenario(date, date, jsonb) to authenticated;

create or replace function public.create_billing_order(
  p_reference text, p_amount_kobo bigint, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare row public.billing_orders%rowtype;
begin
  select * into row from public.billing_orders where user_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('id', row.id, 'reference', row.reference, 'amount_kobo', row.amount_kobo, 'reused', true); end if;
  insert into public.billing_orders (user_id, reference, amount_kobo, idempotency_key, currency)
  values (auth.uid(), p_reference, p_amount_kobo, p_idempotency_key, 'NGN') returning * into row;
  return jsonb_build_object('id', row.id, 'reference', row.reference, 'amount_kobo', row.amount_kobo, 'reused', false);
end; $$;

create or replace function public.get_billing_order(p_order_id uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'reference', reference, 'amount_kobo', amount_kobo, 'currency', currency, 'status', status, 'paid_at', paid_at)
  from public.billing_orders where id = p_order_id and user_id = auth.uid();
$$;

create or replace function public.process_kora_event(
  p_event_hash text, p_event_type text, p_order_reference text, p_amount_kobo bigint,
  p_currency text, p_status text, p_transaction_status text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare row public.billing_orders%rowtype; event_id uuid; final_status text;
begin
  insert into public.webhook_events (event_hash, event_type) values (p_event_hash, p_event_type)
  on conflict (event_hash) do nothing returning id into event_id;
  if event_id is null then return jsonb_build_object('duplicate', true); end if;
  select * into row from public.billing_orders where reference = p_order_reference for update;
  if not found then return jsonb_build_object('ignored', 'unknown_reference'); end if;
  if p_event_type = 'refund.success' then
    update public.billing_orders set status = 'refunded' where id = row.id;
    delete from public.pro_entitlements where user_id = row.user_id;
    return jsonb_build_object('status', 'refunded');
  end if;
  if p_event_type = 'charge.failed' or p_status <> 'success' then
    update public.billing_orders set status = 'failed' where id = row.id;
    return jsonb_build_object('status', 'failed');
  end if;
  if p_currency <> row.currency then return jsonb_build_object('ignored', 'currency_mismatch'); end if;
  if p_amount_kobo < row.amount_kobo or p_transaction_status = 'underpaid' then final_status := 'underpaid';
  elsif p_amount_kobo > row.amount_kobo or p_transaction_status = 'overpaid' then final_status := 'overpaid';
  else final_status := 'paid'; end if;
  update public.billing_orders set status = final_status, paid_amount_kobo = p_amount_kobo,
    paid_at = case when final_status in ('paid', 'overpaid') then now() else paid_at end where id = row.id;
  if final_status in ('paid', 'overpaid') then
    insert into public.pro_entitlements (user_id, expires_at) values (row.user_id, now() + interval '30 days')
    on conflict (user_id) do update set expires_at = excluded.expires_at;
  end if;
  return jsonb_build_object('status', final_status);
end; $$;

grant execute on function public.create_billing_order(text, bigint, text) to authenticated;
grant execute on function public.get_billing_order(uuid) to authenticated;
grant usage on schema public to service_role;
grant execute on function public.process_kora_event(text, text, text, bigint, text, text, text) to service_role;

create or replace function public.delete_import(p_import_id uuid)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare ids uuid[];
begin
  select array_agg(id) into ids from public.transactions where import_id = p_import_id and user_id = auth.uid();
  if ids is null then raise exception 'import not found'; end if;
  delete from public.reconciliation_links where user_id = auth.uid() and txn_ids && ids;
  delete from public.scenarios where user_id = auth.uid()
    and (result->'evidence_txn_ids') ?| (select array_agg(id::text) from unnest(ids) id);
  delete from public.imports where id = p_import_id and user_id = auth.uid();
  return jsonb_build_object('deleted', true);
end; $$;

create or replace function public.delete_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  delete from public.reconciliation_links where user_id = auth.uid();
  delete from public.protections where user_id = auth.uid();
  delete from public.scenarios where user_id = auth.uid();
  delete from public.accounts where user_id = auth.uid();
  insert into public.audit_events (user_id, action, entity) values (auth.uid(), 'delete_data', 'financial_data');
  return jsonb_build_object('deleted', true);
end; $$;

grant execute on function public.delete_import(uuid) to authenticated;
grant execute on function public.delete_my_data() to authenticated;
