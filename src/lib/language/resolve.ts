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

// Resolves the language code for a request. Two precedence modes:
//   - default (token-first), used by the DASHBOARD/auth so it always follows the
//     user's profile: 1) token `lang` claim, 2) remembered `lang` cookie,
//     3) site default.
//   - `preferCookie` (cookie-first), used by PUBLIC page redirects so a visitor's
//     explicit language switch (the `lang` cookie) is honored even when
//     authenticated: 1) cookie, 2) token, 3) site default.
// Every returned code is validated against the available languages so callers
// never redirect to a segment the router can't recognize as a language (which
// would cause an infinite redirect loop). Returns null only when languages can't
// be resolved at all, so callers can fail open.
export async function resolvePreferredLanguageCode(opts: {
  accessToken?: string;
  cookieLanguage?: string;
  preferCookie?: boolean;
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
  const cookieIsValid = Boolean(
    opts.cookieLanguage && languageCodes.includes(opts.cookieLanguage),
  );
  const tokenIsValid = Boolean(
    tokenLanguage && languageCodes.includes(tokenLanguage),
  );

  // Public: an explicit switch (cookie) wins over the profile.
  if (opts.preferCookie && cookieIsValid) {
    return opts.cookieLanguage as string;
  }

  // Authenticated → profile/token language (validated to avoid redirect loops).
  if (tokenIsValid) {
    return tokenLanguage as string;
  }

  // Remembered choice.
  if (cookieIsValid) {
    return opts.cookieLanguage as string;
  }

  // Site default.
  return defaultLanguageCode;
}
