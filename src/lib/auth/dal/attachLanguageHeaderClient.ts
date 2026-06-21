import {AxiosInstance, InternalAxiosRequestConfig} from "axios";
import JsCookie from "js-cookie";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  LANGUAGE_CODE_HEADER,
  LANGUAGE_COOKIE_NAME,
} from "@/constants";

// Reads the `lang` claim from a non-expired access token, mirroring the
// server-side token-first resolution without pulling in a JWT library (the
// access token is stored in a JS-readable cookie). Returns null on anything
// unexpected so the caller can fall back.
function languageFromAccessToken(token?: string): string | null {
  const segment = token?.split(".")[1];
  if (!segment) {
    return null;
  }

  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));

    const expiresAtMs = payload.exp ? payload.exp * 1000 : 0;
    if (expiresAtMs <= Date.now()) {
      return null;
    }

    return typeof payload.lang === "string" && payload.lang.length > 0
      ? payload.lang
      : null;
  } catch {
    return null;
  }
}

// Client-side counterpart of attachLanguageHeaderServer for the browser DAL
// (used by the dashboard). Follows the profile language carried in the access
// token, falling back to the remembered `lang` cookie. When neither is present
// the header is omitted and the backend resolves the authenticated user's
// language. An explicit per-call header always wins.
export function attachLanguageHeaderClient(dal: AxiosInstance) {
  dal.interceptors.request.use((request: InternalAxiosRequestConfig) => {
    if (!request.headers.has(LANGUAGE_CODE_HEADER)) {
      const code =
        languageFromAccessToken(JsCookie.get(ACCESS_TOKEN_COOKIE_NAME)) ??
        JsCookie.get(LANGUAGE_COOKIE_NAME);
      if (code) {
        request.headers.set(LANGUAGE_CODE_HEADER, code);
      }
    }

    return request;
  });
}
