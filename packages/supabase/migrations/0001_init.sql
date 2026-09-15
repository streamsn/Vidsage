-- Core schema: profiles, credit ledger, video cache, questions.
-- All client writes to profiles/videos/questions go through the RPCs in
-- 0002_rpc_functions.sql or the service-role key — never direct client writes.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  credit_balance integer not null default 0,
  teaser_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  type text not null check (
    type in ('signup_bonus', 'purchase', 'question_spend', 'refund', 'adjustment')
  ),
  balance_after integer not null,
  related_question_id bigint,
  related_stripe_event_id text,
  created_at timestamptz not null default now()
);

-- Enforces webhook idempotency: a given Stripe event can only grant credits once.
create unique index credit_transactions_stripe_event_id_key
  on public.credit_transactions (related_stripe_event_id)
  where related_stripe_event_id is not null;

create index credit_transactions_user_id_idx on public.credit_transactions (user_id, created_at);

create table public.videos (
  id text primary key, -- the YouTube video ID
  title text,
  channel_title text,
  duration_seconds integer,
  transcript text,
  transcript_language text,
  transcript_unavailable boolean not null default false,
  summary text,
  topics text[],
  related_videos jsonb,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  error_message text,
  cached_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id text not null references public.videos (id) on delete cascade,
  question text not null,
  answer text,
  was_blurred boolean not null default false,
  is_teaser boolean not null default false,
  unlocked boolean not null default false,
  credits_charged integer not null default 0,
  created_at timestamptz not null default now()
);

create index questions_user_video_idx on public.questions (user_id, video_id, created_at);

-- Keep updated_at current on any row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- Row Level Security: users can only read their own rows. All writes to
-- these tables happen through SECURITY DEFINER RPCs (see 0002) or the
-- service-role key (analyze route caching videos), never direct client
-- writes — so no insert/update/delete policies are defined for authenticated
-- users on profiles/credit_transactions/questions.

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

alter table public.credit_transactions enable row level security;

create policy "credit_transactions_select_own"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

alter table public.videos enable row level security;

-- Videos are a shared cache: any signed-in user can read any video's
-- summary/transcript/related videos. Only service_role writes here.
create policy "videos_select_all"
  on public.videos for select
  using (true);

alter table public.questions enable row level security;

create policy "questions_select_own"
  on public.questions for select
  using (auth.uid() = user_id);
