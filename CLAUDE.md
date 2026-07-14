# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently in the **planning/pre-implementation stage**. There is no application source code, package manifest, build system, or test suite yet — only planning documents and an API reference. Do not assume a framework or invent build/lint/test commands; check with the user or look for a package manifest before assuming any exist.

Current contents:
- `PLANNING.md` — the product spec (기획서): target persona, the 8 planned features, prioritization order, and features explicitly excluded from scope (with reasons).
- `openapi.json` / `openapi (1).json` — OpenAPI spec for the Wanted Developers API (`Wanted OpenAPI V1 Server`, base path `/v1`) that the product is built on.
- `.env` — holds `client_id` / `client_secret` for the Wanted API. Never print or commit real values.
- `README.md` — git branching workflow (below).

## Product context (from PLANNING.md)

**Service**: 원티드 API 기반 대시보드 — a dashboard for first-time/early-career (0–2yr) job seekers, built on top of the Wanted Developers API.

Planned features, in priority/build order (later features depend on earlier ones):
0. 회원가입 & 프로필/포트폴리오 — auth + user profile, **self-built (own DB/auth), not from the Wanted API**. This is a prerequisite for features 3, 4, 6.
1. 신입 맞춤 필터 대시보드 — filters job listings using `annual_from`/`annual_to` to find true entry-level postings.
2. 용어 툴팁 — tooltips explaining `skill_tags`; explanation content must be authored separately (API only returns `{id, title}`).
3. 마감임박 지도 위젯 — D-day sorted deadline list + map markers, using `address.geo_location` from `/jobs/{job_id}` (list endpoint `/jobs` lacks geo data, so per-job detail calls or geocoding are needed for multiple markers).
4. JD 매칭 진단 & 갭 체크리스트 — matches profile tags/portfolio against `skill_tags`/`detail.preferred_points`.
5. 회사 정보(연봉/복지) — salary via `/insight/company?biz_number=` (biz_number from `company.registration_number`; noted as a separately-backed endpoint with possible 503s), benefits via `detail.benefits`/`attraction_tags`.
6. 지원 여정 칸반보드 — application-stage tracking is **not available from the API** (that's ATS-only, employer-side) — must be self-implemented against the feature-0 user account.
7. 신입 채용 트렌드 인사이트 — stats aggregated from `/tags/skills` vs. skill_tags frequency on entry-level postings.

**Explicitly out of scope**: competitor/applicant-count exposure (no such field exists anywhere in the API) and pass-rate prediction (`/ai/pass/text-prediction/async` exists but requires a separate paid contract, not currently available).

**Phase 2 (not current scope)**: employer-facing features would require a different auth scheme (`x-wanted-dashboard-service-key`) and separate employer endpoints (`/ats/*`, `/recruit-company/*`) — a distinct product decision, not just an extension.

When implementing a feature, check PLANNING.md for the exact API fields/endpoints it's supposed to use and any noted tradeoffs before reaching for a different approach.

## Wanted API reference (openapi.json)

Key endpoint groups (base path `/v1`):
- Job seeker-facing: `/jobs`, `/jobs/{job_id}`, `/companies/{company_id}`, `/companies/{company_id}/jobs`, `/tags/categories`, `/tags/skills`, `/tags/attractions`, `/search/*`, `/insight/company`.
- AI prediction (paid, out of MVP scope per PLANNING.md): `/ai/pass/text-prediction/async`, `/ai/apply/text-prediction/async`.
- Employer/ATS-only (different auth, out of scope for the job-seeker dashboard): `/recruit-company/*`, `/ats/*`, `/stat/application/summary`.

Prefer `openapi.json` (the larger, complete spec) as the source of truth over `openapi (1).json` unless told otherwise — check with the user before assuming they're identical or before deleting either.

## Git workflow (from README.md)

- `main` is always deployable — **no direct pushes**; merge only via PR.
- Work on a branch named `feature/이름-작업내용`, then open a PR to `main` for review before merging.
