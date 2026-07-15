"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getSessionUser, logOut } from "@/lib/authStore";
import { getSupabaseClient } from "@/lib/supabase/client";

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

    // 헤더는 루트 레이아웃에 있어 페이지 이동 시 재마운트되지 않는다 — 위 1회성 조회만으로는
    // 로그인/로그아웃 직후 클라이언트 사이드 네비게이션에서 상태가 갱신되지 않는다(새로고침 전까지
    // 헤더가 로그인 이전 상태로 고정되는 버그). onAuthStateChange 구독으로 실시간 반영한다.
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = getSupabaseClient();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) {
          setIsLoggedIn(Boolean(session?.user));
          setChecked(true);
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // Supabase 미설정 시 구독 자체를 건너뛴다 — 위 1회성 조회의 catch가 이미 처리함.
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
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
      <div className="mx-auto flex w-full flex-col gap-2 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            NEEDED
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
          <Link href="/skills-demo" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            용어 사전
          </Link>
          <Link href="/profile" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            마이페이지
          </Link>
        </nav>
      </div>
    </header>
  );
}
