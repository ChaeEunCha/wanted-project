-- 0001_init.sql
-- 근거: 저장소 루트 DB.md 3.2~3.5절 (profiles, profile_category_tags, profile_skill_tags, portfolios)
--
-- DB.md 원안과의 차이점:
-- - DB.md는 자체 `users`(email, password_hash) 테이블을 전제로 했지만, 팀이 인증 엔진으로
--   Supabase Auth를 채택하면서 커스텀 users/password_hash 테이블은 만들지 않는다.
--   Supabase Auth가 `auth.users`를 자체적으로 관리하므로, 아래 모든 테이블의 user_id는
--   `auth.users(id)` (uuid)를 참조한다. (DB.md의 BIGINT 자동증가 PK 대신 Supabase 표준인 uuid FK 사용)
-- - 나머지 컬럼/제약조건(career_years 0~2 CHECK, UNIQUE 조합, portfolios type/url/file_key CHECK 등)은
--   DB.md 설계를 그대로 따른다.

-- =========================================================
-- 3.2 profiles (5-2) — user_id가 PK 겸 auth.users(id) FK (1:1)
-- =========================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  career_years smallint not null check (career_years between 0 and 2),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 3.3 profile_category_tags (5-2) — 관심 직군 태그
-- (category_tag_id는 Wanted `/tags/categories`의 외부 참조, 자체 FK 없음 — DB.md 1절 설계 원칙)
-- =========================================================
create table if not exists public.profile_category_tags (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  category_tag_id integer not null,
  constraint profile_category_tags_user_category_unique unique (user_id, category_tag_id)
);

create index if not exists profile_category_tags_user_id_idx
  on public.profile_category_tags (user_id);

alter table public.profile_category_tags enable row level security;

create policy "profile_category_tags_select_own"
  on public.profile_category_tags for select
  using (auth.uid() = user_id);

create policy "profile_category_tags_insert_own"
  on public.profile_category_tags for insert
  with check (auth.uid() = user_id);

create policy "profile_category_tags_update_own"
  on public.profile_category_tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profile_category_tags_delete_own"
  on public.profile_category_tags for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 3.4 profile_skill_tags (5-2, 5-6 선행) — 관심 스킬 태그
-- (skill_tag_id는 Wanted `/tags/skills`의 외부 참조; skill_tag_title은 표시용 캐시일 뿐
--  매칭 로직의 정본은 항상 skill_tag_id — DB.md 3.4절 참고)
-- =========================================================
create table if not exists public.profile_skill_tags (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_tag_id integer not null,
  skill_tag_title varchar(255) not null,
  constraint profile_skill_tags_user_skill_unique unique (user_id, skill_tag_id)
);

create index if not exists profile_skill_tags_user_id_idx
  on public.profile_skill_tags (user_id);

alter table public.profile_skill_tags enable row level security;

create policy "profile_skill_tags_select_own"
  on public.profile_skill_tags for select
  using (auth.uid() = user_id);

create policy "profile_skill_tags_insert_own"
  on public.profile_skill_tags for insert
  with check (auth.uid() = user_id);

create policy "profile_skill_tags_update_own"
  on public.profile_skill_tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profile_skill_tags_delete_own"
  on public.profile_skill_tags for delete
  using (auth.uid() = user_id);

-- =========================================================
-- 3.5 portfolios (5-2) — URL 또는 파일, 사용자당 최소 1개(애플리케이션 레벨에서 강제)
-- =========================================================
create table if not exists public.portfolios (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('url', 'file')),
  url varchar(2048),
  file_key varchar(512),
  created_at timestamptz not null default now(),
  constraint portfolios_type_payload_check check (
    (type = 'url' and url is not null) or
    (type = 'file' and file_key is not null)
  )
);

create index if not exists portfolios_user_id_idx
  on public.portfolios (user_id);

alter table public.portfolios enable row level security;

create policy "portfolios_select_own"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "portfolios_insert_own"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "portfolios_update_own"
  on public.portfolios for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "portfolios_delete_own"
  on public.portfolios for delete
  using (auth.uid() = user_id);
