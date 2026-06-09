import jwt from "jsonwebtoken";
import {getLanguageConfig} from "./config";

// Reads the language from a non-expired access token's `lang` claim. The backend
// sets this claim at login from the user's profile language, so no profile
// lookup is needed.
function languageFromAccessToken(token: string): string | null {
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

// Resolves the language code for an unprefixed public request:
//   1. authenticated users → the `lang` claim from their access token,
//   2. otherwise → a remembered `lang` cookie when it is a known language,
//   3. otherwise → the site default language (from /api/languages).
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

  const {codes, defaultCode} = config;

  // 1. Authenticated → token language, but only when it is an available
  //    language (a stale/unknown code would loop the prefix redirect forever).
  if (tokenLanguage && codes.includes(tokenLanguage)) {
    return tokenLanguage;
  }

  // 2. Anonymous visitor with a remembered choice.
  if (opts.cookieLanguage && codes.includes(opts.cookieLanguage)) {
    return opts.cookieLanguage;
  }

  // 3. Site default.
  return defaultCode;
}
