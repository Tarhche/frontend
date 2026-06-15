import {INTERNAL_BACKEND_URL} from "@/constants";

export type LanguageConfig = {
  languageCodes: string[];
  defaultLanguageCode: string;
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
    const languageCodes: string[] = Array.isArray(json?.items)
      ? json.items.map((l: any) => l?.code).filter(Boolean)
      : [];
    const defaultLanguageCode: string =
      json?.default_language?.code ?? languageCodes[0] ?? "";

    if (languageCodes.length === 0 || !defaultLanguageCode) {
      return cache?.data ?? null;
    }

    const data: LanguageConfig = {languageCodes, defaultLanguageCode};
    cache = {data, expiresAt: now + TTL_MS};
    return data;
  } catch {
    return cache?.data ?? null;
  }
}
