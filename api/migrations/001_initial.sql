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
  currency text not null check (currency = 'NGN'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'underpaid', 'overpaid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
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
