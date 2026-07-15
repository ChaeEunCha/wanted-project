-- 0002_applications.sql
-- 근거: 저장소 루트 DB.md 3.6절 (applications), PRD.md 5-5절 (지원 여정 칸반보드)
--
-- DB.md 원안과의 차이점:
-- - DB.md는 BIGINT 자동증가 users.id를 전제로 했지만, 0001_init.sql과 동일하게
--   Supabase Auth를 인증 엔진으로 쓰므로 user_id는 `auth.users(id)` (uuid)를 참조한다.
-- - PRD 5-5 AC "원본 공고 링크(url 필드)는 유지"를 만족하려면 링크 자체도 스냅샷으로
--   저장해야 해서, DB.md에는 없는 `job_url_snapshot` 컬럼을 추가했다(공고가 만료돼도
--   카드에서 원본 링크를 계속 보여줘야 하기 때문).
-- - skill_tags_snapshot은 JSON 대신 Postgres의 jsonb로 저장한다(DB.md는 ANSI SQL 표기라
--   구체 타입을 못박지 않았음).

create table if not exists public.applications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id bigint not null,
  status text not null default 'interested'
    check (status in ('interested', 'preparing', 'applied', 'waiting')),
  company_name_snapshot varchar(255) not null,
  due_time_snapshot timestamptz,
  skill_tags_snapshot jsonb,
  job_url_snapshot varchar(2048) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_user_job_unique unique (user_id, job_id)
);

create index if not exists applications_user_status_idx
  on public.applications (user_id, status);

alter table public.applications enable row level security;

create policy "applications_select_own"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "applications_update_own"
  on public.applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "applications_delete_own"
  on public.applications for delete
  using (auth.uid() = user_id);
