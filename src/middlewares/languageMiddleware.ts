import {NextRequest, NextResponse} from "next/server";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import {getLanguageConfig} from "@/lib/language/config";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {resolveClientIp} from "@/lib/client-ip";

// Public content lives under a `/{language}` prefix. These path roots are never
// language-prefixed (API, Next internals, dashboard). Auth pages ARE prefixed
// (/{lang}/auth/...), so they are not excluded here.
const EXCLUDED_PREFIXES = ["/api", "/_next", "/dashboard"];

function isExcluded(pathname: string): boolean {
  if (
    EXCLUDED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }

  // Static assets such as /favicon.ico, /icon.svg, /robots.txt. They are served
  // from `public/`, which is flat, so an asset is always a single segment with a
  // file extension. A dot anywhere else does not make a path an asset —
  // usernames may contain one, as in /authors/@ada.lovelace.
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 1 && /\.[a-z0-9]+$/i.test(segments[0]);
}

// For a public request that lacks a (valid) language prefix, permanently
// redirects to the same path under the preferred language: the `lang` cookie
// when it is a known code, otherwise the site default. Returns undefined when no
// redirect is needed (already prefixed, excluded path, or languages can't be
// resolved — fail open).
export default async function languageMiddleware(
  req: NextRequest,
): Promise<NextResponse | undefined> {
  const {pathname} = req.nextUrl;

  if (isExcluded(pathname)) {
    return;
  }

  const config = await getLanguageConfig(resolveClientIp(req.headers));
  if (!config) {
    return;
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment && config.languageCodes.includes(firstSegment)) {
    return;
  }

  const preferred = await resolvePreferredLanguageCode({
    accessToken: req.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    cookieLanguage: req.cookies.get(LANGUAGE_COOKIE_NAME)?.value,
    clientIp: resolveClientIp(req.headers),
  });

  // Only redirect to a known language segment; otherwise the next request would
  // be unprefixed again and loop forever.
  if (!preferred || !config.languageCodes.includes(preferred)) {
    return;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url, 308);
}
