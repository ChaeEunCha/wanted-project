import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트.
 *
 * 필요한 환경변수:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 저장소 루트의 `.env.local.example`을 복사해 `.env.local`을 만들고 실제 값을 채워 넣을 것.
 *
 * 모듈 최상단에서 즉시 `createClient`를 호출하지 않고 지연 생성(lazy singleton)한다:
 * 이 프로젝트는 아직 실제 Supabase 프로젝트 키가 없는 상태에서도 `next build`/`next lint`가
 * 통과해야 하므로, 클라이언트는 실제로 인증/DB 호출이 필요한 시점(이벤트 핸들러, useEffect 내부)에만
 * 생성한다. 이렇게 하면 환경변수가 비어 있어도 모듈을 import하는 것만으로는 예외가 발생하지 않는다.
 */
let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았어요. 저장소 루트의 .env.local.example을 참고해서 " +
        ".env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 채워주세요."
    );
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}
