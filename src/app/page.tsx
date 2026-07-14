import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="text-center sm:text-left">
        <p className="text-sm font-medium text-violet-60">
          원티드 API 기반 신입 구직자 대시보드
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          처음 구직하는 당신을 위한 개인화 대시보드
        </h1>
        <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400">
          경력 0~2년 신입 구직자가 진짜 신입 공고를 찾고, 지원 과정을 한 곳에서
          관리할 수 있도록 돕습니다. 먼저 회원가입 후 프로필/포트폴리오를
          등록해 보세요.
        </p>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>회원가입 &amp; 프로필/포트폴리오</CardTitle>
          <CardDescription>
            경력, 관심 직군·스킬 태그, 포트폴리오를 등록하면 이후 매칭/추천
            기능에서 재사용돼요. (현재 단계: 프론트엔드 UI만 구현, 인증/DB
            연동은 TODO)
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/login">
            <Button variant="outline">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button>회원가입</Button>
          </Link>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>용어 툴팁 데모 (P2)</CardTitle>
          <CardDescription>
            공고 속 기술 스택 태그에 마우스를 올리거나(PC) 탭하면(모바일) 쉬운
            설명이 떠요. 아직 공고 목록/상세 화면이 없어 목업 공고 카드로
            미리 보여드려요.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/skills-demo">
            <Button variant="outline">데모 보러가기</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
