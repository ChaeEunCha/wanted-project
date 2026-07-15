-- 0005_skill_trend_snapshots_policies.sql
-- 근거: DB.md 4.2절 / PRD.md 5-8절 (P6 신입 채용 트렌드 인사이트)
-- (0002 → 0005로 재번호: 0002_applications.sql과 번호가 겹쳤고, 테이블을 만드는
-- 0004_skill_trend_snapshots.sql보다 뒤에 적용돼야 하기 때문 — 병합 중 정리)
--
-- skill_trend_snapshots는 사용자별 데이터가 아니라 배치 집계 결과를 캐싱하는
-- 전역 테이블이라 다른 테이블처럼 auth.uid() 기준 소유자 정책을 적용할 수 없다.
-- v1에는 별도 배치 스케줄러/서비스 롤 키가 없어(PRD 5-8 "주기: 배치 집계" 참고,
-- 실제 배치 인프라는 v1 범위 밖), 이 API를 호출하는 누구나(anon 포함) 캐시를
-- 읽고 갱신할 수 있도록 허용한다. 민감 정보가 아닌 공개 통계 캐시이므로
-- 이 완화된 정책의 리스크는 낮다고 판단한다 — 실제 배치/서비스 롤 인프라가
-- 생기면 insert/update는 서비스 롤 전용으로 좁혀야 한다.

alter table public.skill_trend_snapshots enable row level security;

create policy "skill_trend_snapshots_select_all"
  on public.skill_trend_snapshots for select
  using (true);

create policy "skill_trend_snapshots_insert_all"
  on public.skill_trend_snapshots for insert
  with check (true);

create policy "skill_trend_snapshots_delete_all"
  on public.skill_trend_snapshots for delete
  using (true);
