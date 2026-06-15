import "server-only";
import {cookies} from "next/headers";
import {getDictionary} from "./dictionary";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";

// Dictionary for server components that don't have a URL `[lang]` segment
// (dashboard, auth). Resolves the language the same way the middleware does:
// access-token claim → remembered cookie → site default.
export async function getServerDictionary() {
  const store = await cookies();
  const languageCode = await resolvePreferredLanguageCode({
    accessToken: store.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    cookieLanguage: store.get(LANGUAGE_COOKIE_NAME)?.value,
  });
  return getDictionary(languageCode);
}
