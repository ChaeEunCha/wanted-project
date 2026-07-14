"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { signUp } from "@/lib/authStore";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/validation";

/**
 * P0 회원가입 화면 (PRD.md 5-2절).
 * TODO(백엔드 연동): 실제로는 여기서 서버 API(POST /api/auth/signup 등)를 호출해
 * `users` 테이블에 email/password_hash를 저장하고 세션 또는 JWT를 발급해야 한다.
 * 인증 방식(세션 vs JWT), 소셜 로그인 도입 여부는 PRD 5-2절 기준 아직 미정이라
 * 여기서는 브라우저 localStorage 기반 mock 저장소(src/lib/authStore.ts)로 대체한다.
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
    passwordConfirm?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordConfirm(password, passwordConfirm);

    if (emailError || passwordError || confirmError) {
      setErrors({
        email: emailError,
        password: passwordError,
        passwordConfirm: confirmError,
      });
      return;
    }

    setSubmitting(true);
    const result = signUp(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }

    router.push("/profile?welcome=1");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>
          신입 구직자로서 나에게 맞는 공고를 찾으려면 먼저 계정을 만들어 주세요.
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="영문+숫자 조합 8자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="비밀번호 확인"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            error={errors.passwordConfirm}
            autoComplete="new-password"
          />

          {errors.form && (
            <p className="text-sm text-red-500" role="alert">
              {errors.form}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "가입 중..." : "가입하고 프로필 등록하기"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            로그인
          </Link>
        </p>
      </Card>
    </div>
  );
}
