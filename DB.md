# DB.md — 자체 DB 스키마 설계

> 이 문서는 [PRD.md](./PRD.md)에 정의된 기능 중 **Wanted API가 제공하지 않아 자체 DB로 관리해야 하는 데이터**를 정리한 것입니다. 각 테이블은 근거가 된 PRD 절 번호를 함께 표기합니다. DB 엔진(PostgreSQL/MySQL 등)은 아직 미정이라 타입은 ANSI SQL에 가까운 범용 표기를 사용했습니다.

## 1. 설계 원칙

- **Wanted API 데이터는 저장하지 않는다(스냅샷 제외)**: `job_id`, `skill_tag_id`, `category_tag_id` 등 원티드 쪽 식별자는 컬럼으로만 참조하고, 자체 DB에 FK를 걸지 않는다 — 원본은 Wanted API에 있고, 우리 DB가 정합성을 보장할 수 없는 외부 시스템이기 때문이다.
- **스냅샷이 필요한 곳만 예외적으로 값 복사**: P3 칸반보드(5-5)처럼 "공고가 만료돼도 카드 내용은 유지"가 요구사항인 경우에만 회사명/마감일/스킬태그 등을 텍스트/JSON으로 복사 저장한다.
- **5-1 툴/기술 사전은 DB 테이블이 아니다**: PRD 5-1절에서 "정적 JSON 사전 파일로 관리, 실시간 서빙 시 외부 API/DB 조회 없이 파일만 참조"라고 명시했으므로, 이 사전은 이 문서의 스코프 밖이다(레포 내 정적 파일로 별도 관리).
- **PK는 `id BIGINT`(자동 증가) 기준으로 통일**하고, 사용자별 유니크 제약이 필요한 곳은 복합 UNIQUE 인덱스를 명시했다.

## 2. ERD 개요

```
users 1───1 profiles
  │
  ├─1───N profile_category_tags
  ├─1───N profile_skill_tags
  ├─1───N portfolios
  ├─1───N applications
  └─1───N gap_checklist_items

(참고용 캐시 테이블 — PRD가 "캐싱" 요구는 했지만 저장 형태를 지정하지 않은 것들)
  term_glossary            (P2, skill_tag_id 기준 단독 테이블)
  skill_trend_snapshots    (P6, 배치 집계 결과)
  job_geo_cache            (P5, job_id 기준 좌표 캐시)
  company_insight_cache    (P1/5-3, biz_number 기준 연봉 캐시)
```

## 3. 핵심 테이블 (PRD 5-2, 5-5, 5-6 — 명시적 요구사항)

### 3.1 `users` (5-2)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 중복 가입 방지 |
| password_hash | VARCHAR(255) | NOT NULL | 정책(길이/복잡도)은 애플리케이션 레벨에서 검증 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | |

### 3.2 `profiles` (5-2)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| user_id | BIGINT | PK, FK → users.id | 1:1 관계 |
| career_years | SMALLINT | NOT NULL, CHECK (career_years BETWEEN 0 AND 2) | 그 이상 값은 UI에서도 차단하지만 DB 레벨 제약으로 이중 방어 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | 마이페이지 수정 시 갱신 |

### 3.3 `profile_category_tags` (5-2)

관심 직군 태그. `/tags/categories` 값을 그대로 참조(다중 선택).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| category_tag_id | INT | NOT NULL | Wanted `/tags/categories`의 태그 ID (FK 아님, 외부 참조) |

- UNIQUE (`user_id`, `category_tag_id`) — 동일 태그 중복 등록 방지

### 3.4 `profile_skill_tags` (5-2, 5-6 선행)

관심 스킬 태그. `/tags/skills?keyword=` 자동완성으로 검색해 `skill_tag_id` 기준으로 저장(제목 문자열 매칭 금지 — P4 매칭 정확도의 전제 조건, PRD 5-2/5-6 참고).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| skill_tag_id | INT | NOT NULL | Wanted 스킬 태그 ID (외부 참조) |
| skill_tag_title | VARCHAR(255) | NOT NULL | 표시용 캐시(제목이 매칭 로직에 쓰이지 않도록 skill_tag_id가 정본) |

- UNIQUE (`user_id`, `skill_tag_id`)

### 3.5 `portfolios` (5-2)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| type | ENUM('url','file') | NOT NULL | |
| url | VARCHAR(2048) | NULLABLE | type='url'일 때 사용 |
| file_key | VARCHAR(512) | NULLABLE | type='file'일 때 사용(저장소 미정 — 9절 참고) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | |

- CHECK: `type='url'`이면 `url IS NOT NULL`, `type='file'`이면 `file_key IS NOT NULL`
- 애플리케이션 레벨에서 "사용자당 최소 1개 이상 등록" 규칙 강제(DB로는 표현 어려움)

### 3.6 `applications` (5-5, 지원 여정 칸반보드)

카드 표시 정보는 **추가 시점 스냅샷**으로 저장한다 — 원본 공고가 마감/삭제돼도 카드 내용이 유지되어야 하기 때문(PRD 5-5 핵심 설계 포인트).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| job_id | BIGINT | NOT NULL | Wanted 공고 ID(외부 참조) |
| status | ENUM('interested','preparing','applied','waiting') | NOT NULL, DEFAULT 'interested' | 관심/준비중/지원함/결과대기 |
| company_name_snapshot | VARCHAR(255) | NOT NULL | 추가 시점 값 |
| due_time_snapshot | TIMESTAMP | NULLABLE | 추가 시점 마감일 |
| skill_tags_snapshot | JSON | NULLABLE | `[{id, title}, ...]` 추가 시점 스냅샷 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | status 변경 시 갱신 |

- UNIQUE (`user_id`, `job_id`) — 동일 공고를 같은 유저가 중복으로 칸반에 추가하지 않도록(팀 협의로 조정 가능)
- INDEX (`user_id`, `status`) — 칸반 컬럼별 조회 최적화

### 3.7 `gap_checklist_items` (5-6, JD 매칭 갭 체크리스트)

매칭률 자체는 저장하지 않고(요청 시 `skill_tags` 교집합으로 즉시 계산), **체크 여부만 영속 저장**한다(PRD 5-6: "체크한다고 프로필 skill_tags가 자동 추가되진 않음").

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| user_id | BIGINT | FK → users.id, NOT NULL | |
| job_id | BIGINT | NOT NULL | Wanted 공고 ID(외부 참조) |
| skill_tag_id | INT | NOT NULL | 갭으로 식별된 스킬 태그 ID |
| is_checked | BOOLEAN | NOT NULL, DEFAULT false | |
| checked_at | TIMESTAMP | NULLABLE | 체크 시점 |

- UNIQUE (`user_id`, `job_id`, `skill_tag_id`)

## 4. 캐시/콘텐츠 테이블 (설계 제안 — PRD가 저장 형태를 못박지 않은 항목)

아래 테이블들은 PRD가 "캐싱한다"/"자체 제작한다"고만 명시하고 구체적 저장 형태(DB vs Redis vs 정적 파일)를 정하지 않은 기능이다. DB 테이블 형태를 제안하지만, 실제 구현 전 팀 협의로 Redis 등 인메모리 캐시로 대체될 수 있다.

### 4.1 `term_glossary` (P2 용어 툴팁, 5-4)

100% 자체 제작 콘텐츠. `skill_tag_id` 기준 매핑(제목 문자열 매칭 금지 — 동명이의 스킬 방지, PRD 5-4).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| skill_tag_id | INT | PK | Wanted 스킬 태그 ID |
| description | TEXT | NOT NULL | 툴팁 설명 문구 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | |

- 설명이 없는 태그는 행 자체가 없음 → 툴팁 미노출(PRD 요구사항과 자연스럽게 일치)

### 4.2 `skill_trend_snapshots` (P6 트렌드 인사이트, 5-8)

배치(예: 1일 1회) 집계 후 캐싱된 결과를 서빙(PRD 5-8). 5-1의 사전 구축 파이프라인을 재사용.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGINT | PK, AUTO INCREMENT | |
| skill_tag_id | INT | NOT NULL | |
| skill_tag_title | VARCHAR(255) | NOT NULL | |
| category_tag_id | INT | NULLABLE | 직군 필터용(PRD: v1 포함 여부 팀 논의 필요) |
| rank | SMALLINT | NOT NULL | TOP10 내 순위 |
| count | INT | NOT NULL | 출현 빈도 |
| aggregated_at | DATE | NOT NULL | 배치 실행일 |

- INDEX (`aggregated_at`, `category_tag_id`, `rank`)

### 4.3 `job_geo_cache` (P5 지도 위젯, 5-7)

"실제로 화면에 노출되는 공고만" 상세 조회 후 캐싱, TTL 예: 1일(PRD 5-7).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| job_id | BIGINT | PK | Wanted 공고 ID |
| latitude | DECIMAL(9,6) | NOT NULL | |
| longitude | DECIMAL(9,6) | NOT NULL | |
| cached_at | TIMESTAMP | NOT NULL, DEFAULT now() | TTL 계산 기준(예: 1일 경과 시 재조회) |

### 4.4 `company_insight_cache` (P1 회사 정보, 5-3)

`/insight/company`가 안정성이 낮고 503이 발생할 수 있어(PRD 5-3 리스크), 성공 응답을 캐싱해두면 폴백 품질을 높일 수 있다는 제안 — PRD가 명시적으로 요구한 캐시는 아님.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| biz_number | VARCHAR(20) | PK | `company.registration_number` |
| average_salary | INT | NULLABLE | |
| hired_salary | INT | NULLABLE | |
| hire_rate | DECIMAL(5,2) | NULLABLE | |
| left_rate | DECIMAL(5,2) | NULLABLE | |
| fetched_at | TIMESTAMP | NOT NULL, DEFAULT now() | |

## 5. DB 스코프에서 명시적으로 제외되는 것

- **5-1 툴/기술 사전**: 정적 JSON 파일로 관리(PRD 5-1 "저장 형태(v1)" 참고) — DB 테이블화는 v1 범위 밖.
- **경쟁 강도/합격률 예측 관련 데이터**: PRD 6절에 따라 기능 자체가 스코프 제외이므로 테이블도 없음.
- **기업용 데이터(Phase 2)**: PRD 7절 참고, 이번 스코프 밖.

## 6. 미정 사항 (구현 착수 전 결정 필요 — PRD 9절과 동일)

- 인증 방식(세션 vs JWT), 소셜 로그인 도입 여부 → `users`/세션 테이블 설계에 영향
- 포트폴리오 파일 저장소(S3 등) 및 허용 형식/최대 용량 → `portfolios.file_key` 포맷에 영향
- DB 엔진(PostgreSQL/MySQL 등) 미정 → 위 타입 표기는 잠정안
- 4절 캐시 테이블들을 DB로 갈지 Redis 등 인메모리로 갈지 — 특히 `job_geo_cache`/`company_insight_cache`는 TTL 무효화가 핵심이라 Redis가 더 적합할 수 있음
