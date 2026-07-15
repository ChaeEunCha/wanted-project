# 배포 전 점검 체크리스트

## 1. 불필요한 컨벤션 위반 코드 없는지

- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run build` 전부 에러 없이 통과
- [ ] `console.log`/`debugger`/주석 처리된 죽은 코드가 남아있지 않은지 (`grep -rn "console.log\|debugger" src/`)
- [ ] 테스트/데모 목적으로 임시로 만든 페이지·컴포넌트(`/skills-demo` 등)가 실제 배포에 필요한 것인지 확인
- [ ] `TODO`/mock 데이터 주석(`mockTags.ts`, `mockJobs.ts` 등)이 배포 범위에 영향 없는지 재확인
- [ ] 사용하지 않는 import/변수 없는지 (lint가 기본적으로 잡아주지만 한 번 더 확인)

## 2. 민감 정보가 노출되는 곳이 없는지

- [ ] `.env`, `.env.local`이 git에 커밋되지 않았는지 (`git ls-files | grep '^\.env'` → `.env.local.example`만 나와야 함)
- [ ] `client_id`/`client_secret`(원티드), Supabase 키, 카카오맵 키가 소스 코드에 하드코딩되어 있지 않은지
- [ ] 클라이언트에 노출돼도 되는 키(`NEXT_PUBLIC_*`)와 서버 전용 키(`client_secret` 등)가 섞이지 않았는지
- [ ] 에러 메시지/콘솔 로그에 사용자 이메일·토큰 등 개인정보나 세션 값이 그대로 찍히지 않는지
- [ ] 배포 환경(Vercel 등)의 환경변수 설정에 실제 키 값이 올바르게 등록됐는지 (로컬 `.env`와 별개로)
