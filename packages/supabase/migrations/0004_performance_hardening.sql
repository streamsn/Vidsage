-- Addresses two Supabase advisor findings:
-- 1. questions.video_id had no covering index for its foreign key.
-- 2. RLS policies called auth.uid() per-row instead of once per query.

create index questions_video_id_idx on public.questions (video_id);

alter policy "profiles_select_own"
  on public.profiles
  using ((select auth.uid()) = id);

alter policy "credit_transactions_select_own"
  on public.credit_transactions
  using ((select auth.uid()) = user_id);

alter policy "questions_select_own"
  on public.questions
  using ((select auth.uid()) = user_id);
