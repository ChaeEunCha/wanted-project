import toolDictionary from "./toolDictionary.json";
import type { JobDetailResponse, JobTag, QualificationBadge } from "@/lib/types";

interface ToolDictionaryEntry {
  canonical: string;
  aliases: string[];
  verified: boolean;
}

// toolDictionary.json은 PRD.md 5-1절의 배치 수집 절차(직군 스코프 /jobs 페이지네이션 →
// skill_tags 빈도 집계 → /tags/skills?keyword= 검증)로 주기적으로 수동 재생성해야 하는 v1 정적 시드다.
const TOOL_DICTIONARY = toolDictionary as ToolDictionaryEntry[];

const BULLET_CHARS_REGEX = /[•·▪○]/g;
const LEADING_BULLET_REGEX = /^[-•·▪○]\s*/;
const CONTEXT_WORDS_REGEX = /사용|활용|숙련|능숙|경험|가능/;
const EXCLUDE_WORDS_REGEX = /우대|선호/;

const MAJOR_REGEX = /전공자|관련\s*전공|전공\s*재학생|전공\s*졸업자/;
const ENROLLMENT_REGEX = /재학\s*생|재학\s*중|졸업\s*예정/;
const ENROLLED_REGEX = /재학\s*생|재학\s*중/;
const GRADUATING_REGEX = /졸업\s*예정/;
const PORTFOLIO_REQUIRED_REGEX = /필수|반드시|제출해\s*주세요|미제출\s*시/;

function splitRequirementLines(requirements: string): string[] {
  return requirements
    .replace(BULLET_CHARS_REGEX, "\n")
    .split("\n")
    .map((line) => line.trim().replace(LEADING_BULLET_REGEX, "").trim())
    .filter((line) => line.length > 0);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAlias(lineLower: string, alias: string): boolean {
  const boundary = "(^|[^a-z0-9가-힣])";
  const pattern = new RegExp(`${boundary}${escapeRegExp(alias)}${boundary}`, "i");
  return pattern.test(lineLower);
}

function matchMajor(line: string): boolean {
  return MAJOR_REGEX.test(line);
}

function buildMajorLabel(line: string): string {
  const match = MAJOR_REGEX.exec(line);
  if (!match) return "전공 조건";
  const prefix = line.slice(0, match.index);
  const tokens = prefix
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && token !== "관련");
  const shortPrefix = tokens.slice(-2).join("·");
  return shortPrefix ? `${shortPrefix} 전공` : match[0].trim();
}

function matchEnrollment(line: string): boolean {
  return ENROLLMENT_REGEX.test(line);
}

function buildEnrollmentLabel(line: string): string {
  const enrolled = ENROLLED_REGEX.test(line);
  const graduating = GRADUATING_REGEX.test(line);
  if (enrolled && graduating) return "재학생/졸업예정";
  if (enrolled) return "재학생";
  return "졸업예정";
}

function matchPortfolioRequired(line: string): boolean {
  return line.includes("포트폴리오") && PORTFOLIO_REQUIRED_REGEX.test(line);
}

interface ExtractResult {
  badges: QualificationBadge[];
  otherLines: string[];
}

export function extractQualificationBadges(job: JobDetailResponse): ExtractResult {
  const requirements = job.detail?.requirements ?? "";
  const skillTags: JobTag[] = job.skill_tags ?? [];
  const skillTagNamesLower = new Set(skillTags.map((tag) => tag.text.toLowerCase()));

  const badges: QualificationBadge[] = [];
  const otherLines: string[] = [];
  const matchedToolCanonicals = new Set<string>();

  for (const line of splitRequirementLines(requirements)) {
    if (EXCLUDE_WORDS_REGEX.test(line)) {
      otherLines.push(line);
      continue;
    }

    let matched = false;

    if (matchMajor(line)) {
      badges.push({ category: "major", label: buildMajorLabel(line) });
      matched = true;
    }

    if (matchEnrollment(line)) {
      badges.push({ category: "enrollment", label: buildEnrollmentLabel(line) });
      matched = true;
    }

    if (matchPortfolioRequired(line)) {
      badges.push({ category: "portfolio", label: "포트폴리오 제출 필수" });
      matched = true;
    }

    const contextMatch = CONTEXT_WORDS_REGEX.exec(line);
    if (contextMatch) {
      const lineLower = line.toLowerCase();
      for (const entry of TOOL_DICTIONARY) {
        if (skillTagNamesLower.has(entry.canonical.toLowerCase())) continue;
        if (matchedToolCanonicals.has(entry.canonical)) continue;
        if (entry.aliases.some((alias) => containsAlias(lineLower, alias))) {
          badges.push({ category: "tool", label: `${entry.canonical} ${contextMatch[0]}` });
          matchedToolCanonicals.add(entry.canonical);
          matched = true;
        }
      }
    }

    if (!matched) {
      otherLines.push(line);
    }
  }

  for (const tag of skillTags) {
    if (matchedToolCanonicals.has(tag.text)) continue;
    badges.push({ category: "tool", label: tag.text });
    matchedToolCanonicals.add(tag.text);
  }

  return { badges, otherLines };
}

export interface EntryLevelInfo {
  isTrulyEntryLevel: boolean;
  supportingText: string;
}

/** PRD 5-1: annual_from이 0(또는 미기재)이면 "진짜 신입 가능" */
export function describeEntryLevel(
  annualFrom: number | undefined,
  annualTo: number | undefined
): EntryLevelInfo {
  const from = annualFrom ?? 0;
  const isTrulyEntryLevel = from === 0;
  const supportingText = annualTo === 100 ? "0년 이상" : `0~${annualTo ?? 0}년`;
  return { isTrulyEntryLevel, supportingText };
}
