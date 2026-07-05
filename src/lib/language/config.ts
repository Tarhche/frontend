import {headers as nextHeaders} from "next/headers";
import {INTERNAL_BACKEND_URL} from "@/constants";
import {resolveClientIp} from "@/lib/client-ip";

export type LanguageConfig = {
  languageCodes: string[];
  defaultLanguageCode: string;
};

const TTL_MS = 60_000; // 1 minute

let cache: {data: LanguageConfig; expiresAt: number} | null = null;

// Reads the client IP from the ambient request scope. Fails open: outside a
// request scope (middleware, static generation) `nextHeaders()` throws and we
// return null — middleware passes the IP explicitly instead.
async function clientIpFromRequestScope(): Promise<string | null> {
  try {
    return resolveClientIp(await nextHeaders());
  } catch {
    return null;
  }
}

// Resolves the set of available language codes and the site default from the
// backend. The result is memoized for a short TTL so the (per-request)
// middleware doesn't hit the backend on every navigation. Returns null when the
// languages can't be resolved so callers can fail open. On cache misses the
// client IP (explicit `clientIp`, or the ambient request's) is forwarded so the
// backend sees the client that triggered the refetch rather than the frontend
// server.
export async function getLanguageConfig(
  clientIp?: string | null,
): Promise<LanguageConfig | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }

  try {
    const ip = clientIp ?? (await clientIpFromRequestScope());
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/languages`, {
      cache: "no-store",
      headers: ip ? {"x-forwarded-for": ip} : undefined,
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
