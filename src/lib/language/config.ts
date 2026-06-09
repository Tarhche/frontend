import {INTERNAL_BACKEND_URL} from "@/constants";

export type LanguageConfig = {
  codes: string[];
  defaultCode: string;
};

const TTL_MS = 60_000;

let cache: {data: LanguageConfig; expiresAt: number} | null = null;

// Resolves the set of available language codes and the site default from the
// backend. The result is memoized for a short TTL so the (per-request)
// middleware doesn't hit the backend on every navigation. Returns null when the
// languages can't be resolved so callers can fail open.
export async function getLanguageConfig(): Promise<LanguageConfig | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/languages`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return cache?.data ?? null;
    }

    const json = await response.json();
    const codes: string[] = Array.isArray(json?.items)
      ? json.items.map((l: any) => l?.code).filter(Boolean)
      : [];
    const defaultCode: string = json?.default_language?.code ?? codes[0] ?? "";

    if (codes.length === 0 || !defaultCode) {
      return cache?.data ?? null;
    }

    const data: LanguageConfig = {codes, defaultCode};
    cache = {data, expiresAt: now + TTL_MS};
    return data;
  } catch {
    return cache?.data ?? null;
  }
}
