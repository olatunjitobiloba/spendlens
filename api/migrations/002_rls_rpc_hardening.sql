-- Apply after 001_initial.sql.
--
-- Supabase functions receive EXECUTE by PUBLIC unless that default is revoked.
-- These RPCs either act on a caller's financial data or run as service-role-only
-- webhook handlers, so make every intended caller explicit.

revoke execute on function public.commit_import(text, text, jsonb, jsonb, date, date) from public;
revoke execute on function public.set_reconciliation_state(uuid, text) from public;
revoke execute on function public.set_protections(text[]) from public;
revoke execute on function public.get_analysis(date, date) from public;
revoke execute on function public.calculate_scenario(date, date, jsonb) from public;
revoke execute on function public.create_billing_order(text, bigint, text) from public;
revoke execute on function public.get_billing_order(uuid) from public;
revoke execute on function public.process_kora_event(text, text, text, bigint, text, text, text) from public;
revoke execute on function public.delete_import(uuid) from public;
revoke execute on function public.delete_my_data() from public;

grant execute on function public.commit_import(text, text, jsonb, jsonb, date, date) to authenticated;
grant execute on function public.set_reconciliation_state(uuid, text) to authenticated;
grant execute on function public.set_protections(text[]) to authenticated;
grant execute on function public.get_analysis(date, date) to authenticated;
grant execute on function public.calculate_scenario(date, date, jsonb) to authenticated;
grant execute on function public.create_billing_order(text, bigint, text) to authenticated;
grant execute on function public.get_billing_order(uuid) to authenticated;
grant execute on function public.delete_import(uuid) to authenticated;
grant execute on function public.delete_my_data() to authenticated;
grant execute on function public.process_kora_event(text, text, text, bigint, text, text, text) to service_role;

-- The two user-facing SECURITY DEFINER functions must never operate with an
-- empty JWT identity (for example, when accidentally invoked by a service key).
create or replace function public.create_billing_order(
  p_reference text, p_amount_kobo bigint, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare row public.billing_orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  select * into row from public.billing_orders
  where user_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('id', row.id, 'reference', row.reference,
      'amount_kobo', row.amount_kobo, 'reused', true);
  end if;
  insert into public.billing_orders (user_id, reference, amount_kobo, idempotency_key, currency)
  values (auth.uid(), p_reference, p_amount_kobo, p_idempotency_key, 'NGN')
  returning * into row;
  return jsonb_build_object('id', row.id, 'reference', row.reference,
    'amount_kobo', row.amount_kobo, 'reused', false);
end;
$$;

create or replace function public.get_billing_order(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  return (
    select jsonb_build_object('id', id, 'reference', reference,
      'amount_kobo', amount_kobo, 'currency', currency,
      'status', status, 'paid_at', paid_at)
    from public.billing_orders
    where id = p_order_id and user_id = auth.uid()
  );
end;
$$;

create or replace function public.delete_my_data()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  delete from public.reconciliation_links where user_id = auth.uid();
  delete from public.protections where user_id = auth.uid();
  delete from public.scenarios where user_id = auth.uid();
  delete from public.accounts where user_id = auth.uid();
  insert into public.audit_events (user_id, action, entity)
  values (auth.uid(), 'delete_data', 'financial_data');
  return jsonb_build_object('deleted', true);
end;
$$;
