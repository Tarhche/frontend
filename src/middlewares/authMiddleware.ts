import {NextRequest, NextResponse} from "next/server";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXP,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
} from "@/constants";
import {refreshCoordinator} from "@/lib/auth/refresh/RefreshCoordinator";
import {resolveClientIp} from "@/lib/client-ip";

// Refreshes an access token that is missing or about to run out, and hands the
// new pair to the browser and to the request alike, so whatever renders next
// reads the fresh one.
//
// Refreshing is all it does. It is the only thing that has to happen here,
// because only a middleware can put a cookie in front of a page it has not
// rendered yet; who may see what is decided in the page tree, where redirect()
// works and no url has to be built by hand. The dashboard's own layout turns
// away anybody this could not sign in.

export default async function authMiddleware(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  let newAccessToken: string | undefined;
  let newRefreshToken: string | undefined;

  if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
    try {
      const tokens = await refreshCoordinator.swap(
        refreshToken,
        resolveClientIp(req.headers),
      );
      newAccessToken = tokens.access_token;
      newRefreshToken = tokens.refresh_token;
    } catch {
      // refresh failed; let the downstream handler decide what to do
    }
  }

  const requestHeaders = new Headers(req.headers);

  if (newAccessToken && newRefreshToken) {
    rewriteCookieHeader({
      newAccessToken,
      newRefreshToken,
      allCookies: req.cookies.getAll(),
      requestHeaders,
    });
  }

  const res = NextResponse.next({
    request: {headers: requestHeaders},
  });

  if (newAccessToken && newRefreshToken) {
    res.cookies.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, {
      maxAge: ACCESS_TOKEN_EXP,
      path: "/",
    });
    res.cookies.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
      maxAge: REFRESH_TOKEN_EXP,
      path: "/",
    });
  }

  return res;
}

const isTokenExpired = (accessToken: string) => {
  const decodedToken: any = jwt.decode(accessToken || "");
  const expiresAt = !decodedToken?.exp ? 0 : decodedToken.exp * 1000;
  return new Date(expiresAt).getTime() - Date.now() < 60000;
};

const rewriteCookieHeader = ({
  newAccessToken,
  newRefreshToken,
  allCookies,
  requestHeaders,
}: {
  newAccessToken: string;
  newRefreshToken: string;
  allCookies: {name: string; value: string}[];
  requestHeaders: Headers;
}) => {
  const cookieMap = new Map<string, string>();
  for (const c of allCookies) {
    cookieMap.set(c.name, c.value);
  }
  cookieMap.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken);
  cookieMap.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken);

  const cookieHeader = Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

  requestHeaders.set("cookie", cookieHeader);
};
