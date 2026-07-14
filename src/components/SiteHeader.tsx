import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          신입 구직자 대시보드
        </Link>
        <nav className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/profile" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            마이페이지
          </Link>
          <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            로그인
          </Link>
          <Link href="/signup" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            회원가입
          </Link>
        </nav>
      </div>
    </header>
  );
}
