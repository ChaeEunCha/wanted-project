-- 0004_skill_trend_snapshots.sql
-- 근거: DB.md 4.2절 / PRD.md 5-8절 (P6 신입 채용 트렌드 인사이트)
--
-- 0002_skill_trend_snapshots_policies.sql(PR #18, "신입 채용 트렌드 인사이트 구현")가
-- 이 테이블에 RLS 정책만 추가하고 CREATE TABLE을 누락했다 — 병합 중 발견되어 보완한다.
-- 정책 마이그레이션이 이 테이블에 ALTER TABLE을 실행하므로, 번호상 반드시 그보다
-- 먼저 적용돼야 한다(정책 파일은 0005로 재번호 처리).

create table if not exists public.skill_trend_snapshots (
  id bigint generated always as identity primary key,
  skill_tag_id integer not null,
  skill_tag_title varchar(255) not null,
  category_tag_id integer,
  rank smallint not null,
  count integer not null,
  aggregated_at date not null
);

create index if not exists skill_trend_snapshots_lookup_idx
  on public.skill_trend_snapshots (aggregated_at, category_tag_id, rank);
