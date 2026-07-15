-- 0003_gap_checklist.sql
-- 근거: 저장소 루트 DB.md 3.7절 (gap_checklist_items), PRD.md 5-6절 (JD 매칭 진단 & 갭 체크리스트)
--
-- DB.md 원안과의 차이점:
-- - DB.md는 BIGINT 자동증가 users.id를 전제로 했지만, 0001_init.sql/0002_applications.sql과
--   동일하게 Supabase Auth를 인증 엔진으로 쓰므로 user_id는 `auth.users(id)` (uuid)를 참조한다.
-- - 매칭률 자체는 저장하지 않는다(PRD 5-6: 요청 시 skill_tags 교집합으로 즉시 계산) —
--   이 테이블은 "체크 여부"만 영속화한다.

create table if not exists public.gap_checklist_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id bigint not null,
  skill_tag_id integer not null,
  is_checked boolean not null default false,
  checked_at timestamptz,
  constraint gap_checklist_items_user_job_skill_unique unique (user_id, job_id, skill_tag_id)
);

create index if not exists gap_checklist_items_user_job_idx
  on public.gap_checklist_items (user_id, job_id);

alter table public.gap_checklist_items enable row level security;

create policy "gap_checklist_items_select_own"
  on public.gap_checklist_items for select
  using (auth.uid() = user_id);

create policy "gap_checklist_items_insert_own"
  on public.gap_checklist_items for insert
  with check (auth.uid() = user_id);

create policy "gap_checklist_items_update_own"
  on public.gap_checklist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "gap_checklist_items_delete_own"
  on public.gap_checklist_items for delete
  using (auth.uid() = user_id);
