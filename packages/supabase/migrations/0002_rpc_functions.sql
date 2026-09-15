-- Atomic credit/teaser logic. These SECURITY DEFINER functions are the only
-- way profiles.credit_balance, profiles.teaser_used, credit_transactions,
-- and questions get written by anything other than the service-role key.

-- Grants the silent 3-credit signup bonus exactly once, server-side, the
-- moment a Google OAuth sign-in creates a new auth.users row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, credit_balance)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    3
  );

  insert into public.credit_transactions (user_id, amount, type, balance_after)
  values (new.id, 3, 'signup_bonus', 3);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Called before generating an answer. Row-locks the caller's profile so
-- concurrent double-clicks can't double-spend or double-grant the teaser,
-- then decides what /api/ask is allowed to do next:
--   'charge'  -> credit was decremented, go call the LLM
--   'teaser'  -> no credit charged, go call the LLM, blur the response
--   'blocked' -> no row inserted, do NOT call the LLM at all
create or replace function public.rpc_begin_question(p_video_id text, p_question text)
returns table (question_id bigint, decision text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_teaser_used boolean;
  v_new_balance integer;
  v_question_id bigint;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select credit_balance, teaser_used
    into v_balance, v_teaser_used
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile not found for user %', v_user_id;
  end if;

  if v_balance > 0 then
    v_new_balance := v_balance - 1;

    update public.profiles
    set credit_balance = v_new_balance
    where id = v_user_id;

    insert into public.questions (user_id, video_id, question, credits_charged)
    values (v_user_id, p_video_id, p_question, 1)
    returning id into v_question_id;

    insert into public.credit_transactions (user_id, amount, type, balance_after, related_question_id)
    values (v_user_id, -1, 'question_spend', v_new_balance, v_question_id);

    return query select v_question_id, 'charge'::text;

  elsif not v_teaser_used then
    update public.profiles
    set teaser_used = true
    where id = v_user_id;

    insert into public.questions (user_id, video_id, question, was_blurred, is_teaser, credits_charged)
    values (v_user_id, p_video_id, p_question, true, true, 0)
    returning id into v_question_id;

    return query select v_question_id, 'teaser'::text;

  else
    return query select null::bigint, 'blocked'::text;
  end if;
end;
$$;

-- Writes the generated answer once the LLM call succeeds.
create or replace function public.rpc_finalize_question(p_question_id bigint, p_answer text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated bigint;
begin
  update public.questions
  set answer = p_answer
  where id = p_question_id and user_id = v_user_id
  returning id into v_updated;

  if v_updated is null then
    raise exception 'question % not found or not owned by caller', p_question_id;
  end if;
end;
$$;

-- Called if the Claude call fails after rpc_begin_question already reserved
-- a credit or the one-time teaser, so a transient API failure doesn't cost
-- the user anything.
create or replace function public.rpc_refund_question(p_question_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_teaser boolean;
  v_credits_charged integer;
begin
  select is_teaser, credits_charged
    into v_is_teaser, v_credits_charged
  from public.questions
  where id = p_question_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'question % not found or not owned by caller', p_question_id;
  end if;

  if v_is_teaser then
    update public.profiles
    set teaser_used = false
    where id = v_user_id;
  elsif v_credits_charged > 0 then
    update public.profiles
    set credit_balance = credit_balance + v_credits_charged
    where id = v_user_id;

    insert into public.credit_transactions (user_id, amount, type, balance_after, related_question_id)
    select v_user_id, v_credits_charged, 'refund', credit_balance, p_question_id
    from public.profiles
    where id = v_user_id;
  end if;

  delete from public.questions where id = p_question_id;
end;
$$;

-- Called ONLY by the Stripe webhook handler via the service-role key. Tops
-- up the buyer's balance and, in the same transaction, auto-unlocks their
-- latest unresolved blurred teaser answer for free. Idempotent against
-- Stripe's at-least-once webhook delivery.
create or replace function public.rpc_grant_purchase_credits(
  p_user_id uuid,
  p_amount integer,
  p_stripe_event_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance integer;
  v_teaser_question_id bigint;
begin
  if exists (
    select 1 from public.credit_transactions
    where related_stripe_event_id = p_stripe_event_id
  ) then
    return; -- already processed this Stripe event, no-op
  end if;

  update public.profiles
  set credit_balance = credit_balance + p_amount
  where id = p_user_id
  returning credit_balance into v_new_balance;

  if not found then
    raise exception 'profile not found for user %', p_user_id;
  end if;

  insert into public.credit_transactions (user_id, amount, type, balance_after, related_stripe_event_id)
  values (p_user_id, p_amount, 'purchase', v_new_balance, p_stripe_event_id);

  select id into v_teaser_question_id
  from public.questions
  where user_id = p_user_id and is_teaser = true and unlocked = false
  order by created_at desc
  limit 1;

  if v_teaser_question_id is not null then
    update public.questions
    set unlocked = true
    where id = v_teaser_question_id;
  end if;
exception
  when unique_violation then
    -- Concurrent webhook retry raced us past the exists-check above; the
    -- first call already applied this event, so treat this one as a no-op.
    return;
end;
$$;

-- authenticated users call the per-question RPCs directly (auth.uid()-scoped).
grant execute on function public.rpc_begin_question(text, text) to authenticated;
grant execute on function public.rpc_finalize_question(bigint, text) to authenticated;
grant execute on function public.rpc_refund_question(bigint) to authenticated;

-- Only the backend's service-role key may grant purchased credits.
revoke execute on function public.rpc_grant_purchase_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.rpc_grant_purchase_credits(uuid, integer, text) to service_role;
