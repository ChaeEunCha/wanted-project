import type { CareerYears, MockUser, PortfolioEntry, UserProfile } from "./types";
import type { CategorySubTag, SkillTag } from "./types";

/**
 * TODO(백엔드 연동): 이 파일 전체는 실제 인증/DB 연동 이전까지 사용하는 임시 클라이언트 상태 저장소다.
 * - 실제 서비스에서는 회원가입/로그인이 서버 API(세션 또는 JWT 발급)를 거쳐야 하고,
 *   비밀번호는 서버에서 해시(bcrypt 등)되어 `users.password_hash`로 저장되어야 한다.
 * - 여기서는 브라우저 `localStorage`에 평문으로 값을 흉내내어 저장할 뿐이며, 절대 실제 서비스에 그대로 쓰면 안 된다.
 * - `profiles`/`profile_category_tags`/`profile_skill_tags`/`portfolios` 테이블도
 *   마찬가지로 로그인한 사용자 이메일을 키로 한 localStorage 값으로만 흉내낸다.
 * - 인증 방식(세션 vs JWT), 소셜 로그인 여부, 포트폴리오 파일 저장소는 PRD.md 5-2절 기준 아직 미정이라
 *   실제 파일 업로드는 구현하지 않고 파일명만 클라이언트에 보관한다.
 */

const USERS_KEY = "wanted:mock:users";
const SESSION_KEY = "wanted:mock:session";
const PROFILE_KEY_PREFIX = "wanted:mock:profile:";

interface StoredUser extends MockUser {
  // NOTE: 실제로는 절대 평문 저장 금지. 데모 목적의 임시 값.
  passwordPlain: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readUsers(): StoredUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function emailExists(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return readUsers().some((u) => u.email.toLowerCase() === normalized);
}

export function signUp(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (emailExists(normalized)) {
    return { ok: false, error: "이미 가입된 이메일이에요." };
  }
  const users = readUsers();
  users.push({
    email: normalized,
    passwordPlain: password,
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);
  setSession(normalized);
  return { ok: true };
}

export function logIn(
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  const user = readUsers().find((u) => u.email.toLowerCase() === normalized);
  if (!user || user.passwordPlain !== password) {
    return { ok: false, error: "이메일 또는 비밀번호가 올바르지 않아요." };
  }
  setSession(normalized);
  return { ok: true };
}

export function logOut() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

function setSession(email: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY, email);
}

export function getSessionEmail(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

const EMPTY_PROFILE: UserProfile = {
  careerYears: null,
  categoryTags: [],
  skillTags: [],
  portfolios: [],
};

export function getProfile(email: string): UserProfile {
  if (!isBrowser()) return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY_PREFIX + email);
    return raw ? (JSON.parse(raw) as UserProfile) : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(email: string, profile: UserProfile) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY_PREFIX + email, JSON.stringify(profile));
}

export type { CareerYears, CategorySubTag, SkillTag, PortfolioEntry, UserProfile };
