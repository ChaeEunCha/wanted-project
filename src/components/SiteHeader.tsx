"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionUser, logOut } from "@/lib/authStore";

export function SiteHeader() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSessionUser()
      .then((user) => {
        if (cancelled) return;
        setIsLoggedIn(Boolean(user));
        setChecked(true);
      })
      .catch(() => {
        // 세션 조회 실패(예: Supabase 미설정) 시에도 비로그인 상태로 확정한다.
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogOut() {
    await logOut();
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          신입 구직자 대시보드
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            대시보드
          </Link>
          <Link href="/profile" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            마이페이지
          </Link>
          {checked && isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogOut}
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              로그아웃
            </button>
          ) : (
            <>
              <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                로그인
              </Link>
              <Link href="/signup" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
