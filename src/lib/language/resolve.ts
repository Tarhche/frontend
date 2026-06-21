import jwt from "jsonwebtoken";
import {getLanguageConfig} from "./config";

// Reads the language from a non-expired access token's `lang` claim. The backend
// sets this claim at login from the user's profile language, so no profile
// lookup is needed.
export function languageFromAccessToken(token: string): string | null {
  const decoded: any = jwt.decode(token || "");
  if (!decoded) {
    return null;
  }

  const expiresAtMs = decoded.exp ? decoded.exp * 1000 : 0;
  if (expiresAtMs <= Date.now()) {
    return null;
  }

  return typeof decoded.lang === "string" && decoded.lang.length > 0
    ? decoded.lang
    : null;
}

// Resolves the in-use language code for a request, the same way for every
// surface (public AND dashboard/auth): the `lang` cookie is the source of truth.
// It is seeded from the user's profile at login and updated whenever they switch
// language in the header, so:
//   1) `lang` cookie (the in-use language),
//   2) access-token `lang` claim — profile fallback when there is no cookie yet,
//   3) site default.
// Every returned code is validated against the available languages so callers
// never redirect to a segment the router can't recognize as a language (which
// would cause an infinite redirect loop). Returns null only when languages can't
// be resolved at all, so callers can fail open.
export async function resolvePreferredLanguageCode(opts: {
  accessToken?: string;
  cookieLanguage?: string;
}): Promise<string | null> {
  const config = await getLanguageConfig();

  const tokenLanguage = opts.accessToken
    ? languageFromAccessToken(opts.accessToken)
    : null;

  // Languages unavailable: best-effort token language. The middleware won't act
  // without config, so this can't cause a redirect loop.
  if (!config) {
    return tokenLanguage;
  }

  const {languageCodes, defaultLanguageCode} = config;

  // The in-use language (set on login from the profile, updated by the header
  // switcher) wins everywhere.
  if (opts.cookieLanguage && languageCodes.includes(opts.cookieLanguage)) {
    return opts.cookieLanguage;
  }

  // Profile language (validated to avoid redirect loops) when no cookie yet.
  if (tokenLanguage && languageCodes.includes(tokenLanguage)) {
    return tokenLanguage;
  }

  // Site default.
  return defaultLanguageCode;
}
