# wanted-project

팀 협업 프로젝트입니다.

## 브랜치 전략

- `main`: 항상 배포 가능한 상태를 유지하는 기본 브랜치. 직접 push 금지, PR로만 병합합니다.
- 팀원별/기능별 브랜치에서 작업 후 `main`으로 Pull Request를 올려 리뷰 후 병합합니다.

브랜치 이름 예시:

```
git checkout -b feature/이름-작업내용
```

## 작업 흐름

1. `main`에서 최신 상태로 새 브랜치 생성
2. 작업 후 커밋 및 push
3. GitHub에서 `main`으로 Pull Request 생성
4. 팀원 리뷰 후 병합
