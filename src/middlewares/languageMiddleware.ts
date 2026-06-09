import {NextRequest, NextResponse} from "next/server";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import {getLanguageConfig} from "@/lib/language/config";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";

// Public content lives under a `/{language}` prefix. These path roots are never
// language-prefixed (API, Next internals, dashboard and auth pages).
const EXCLUDED_PREFIXES = ["/api", "/_next", "/dashboard", "/auth"];

function isExcluded(pathname: string): boolean {
  if (
    EXCLUDED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }

  // Static assets such as /favicon.ico, /icon.svg, /robots.txt.
  const lastSegment = pathname.split("/").pop() ?? "";
  return lastSegment.includes(".");
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

  const config = await getLanguageConfig();
  if (!config) {
    return;
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment && config.codes.includes(firstSegment)) {
    return;
  }

  // Authenticated → the user's language (from the JWT); otherwise → remembered
  // cookie or the site default. Same resolution the root page uses.
  const preferred = await resolvePreferredLanguageCode({
    accessToken: req.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    cookieLanguage: req.cookies.get(LANGUAGE_COOKIE_NAME)?.value,
  });

  // Only redirect to a known language segment; otherwise the next request would
  // be unprefixed again and loop forever.
  if (!preferred || !config.codes.includes(preferred)) {
    return;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${preferred}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url, 308);
}
