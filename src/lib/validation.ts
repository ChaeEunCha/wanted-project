/**
 * 회원가입/로그인 폼 클라이언트 유효성 검사 규칙.
 * TODO(백엔드 연동): 실제 서비스에서는 서버 측(및 DB 유니크 제약)에서도 동일하게 검증해야 한다.
 * 여기서는 프론트엔드 UX용 1차 검증만 담당한다.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "이메일을 입력해 주세요.";
  if (!EMAIL_REGEX.test(email)) return "올바른 이메일 형식이 아니에요.";
  return null;
}

/** 비밀번호 정책: 8자 이상, 영문+숫자 조합 포함 */
export function validatePassword(password: string): string | null {
  if (!password) return "비밀번호를 입력해 주세요.";
  if (password.length < 8) return "비밀번호는 8자 이상이어야 해요.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "영문과 숫자를 함께 포함해야 해요.";
  }
  return null;
}

export function validatePasswordConfirm(
  password: string,
  confirm: string
): string | null {
  if (!confirm) return "비밀번호를 한 번 더 입력해 주세요.";
  if (password !== confirm) return "비밀번호가 일치하지 않아요.";
  return null;
}
