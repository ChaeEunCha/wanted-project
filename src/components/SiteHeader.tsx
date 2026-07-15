"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            신입 구직자 대시보드
          </Link>
          {checked && isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={handleLogOut}>
              로그아웃
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
        <nav className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            대시보드
          </Link>
          <Link href="/applications" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            지원 현황
          </Link>
          <Link href="/trends" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            트렌드
          </Link>
          <Link href="/profile" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            마이페이지
          </Link>
        </nav>
      </div>
    </header>
  );
}
