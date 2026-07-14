"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { logIn } from "@/lib/authStore";
import { validateEmail } from "@/lib/validation";

/**
 * TODO(백엔드 연동): 실제로는 서버 API(POST /api/auth/login 등)로 인증하고
 * 세션 쿠키 또는 JWT를 발급받아야 한다. 여기서는 src/lib/authStore.ts의
 * localStorage mock 저장소를 사용한다.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string | null;
    form?: string | null;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError || !password) {
      setErrors({ email: emailError, form: !password ? "비밀번호를 입력해 주세요." : null });
      return;
    }

    setSubmitting(true);
    const result = logIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }

    router.push("/profile");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardTitle>로그인</CardTitle>
        <CardDescription>등록한 이메일과 비밀번호로 로그인하세요.</CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {errors.form && (
            <p className="text-sm text-red-500" role="alert">
              {errors.form}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
            회원가입
          </Link>
        </p>
      </Card>
    </div>
  );
}
