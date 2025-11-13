import {NextRequest, NextResponse} from "next/server";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXP,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
} from "@/constants";
import {refreshToken as refreshTokenAuthRequest} from "@/dal/public/auth";

const refreshTokenPromises = new Map<string, any>();

export default async function authMiddleware(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  let newRefreshToken, newAccessToken;
  if (accessToken) {
    if (isTokenExpired(accessToken)) {
      const data = await doRefreshToken({refreshToken});
      if (data) {
        newAccessToken = data.accessToken;
        newRefreshToken = data.refreshToken;
      }
    }
  }

  const requestHeaders = new Headers(req.headers);

  if (newAccessToken && newRefreshToken) {
    setNewCookieHeader({
      newAccessToken,
      newRefreshToken,
      allCookies: req.cookies.getAll(),
      requestHeaders,
    });
  }

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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

    // clear map
    refreshTokenPromises.delete(refreshToken!);
  }

  return res;
}

// if less than 1 minute is left
const isTokenExpired = (accessToken: string) => {
  const decodedToken: any = jwt.decode(accessToken || "");
  const expiresAt = !decodedToken?.exp ? 0 : decodedToken.exp * 1000;

  return new Date(expiresAt).getTime() - Date.now() < 60000;
};

const setNewCookieHeader = ({
  newAccessToken,
  newRefreshToken,
  allCookies,
  requestHeaders,
}) => {
  const cookieMap = new Map<string, string>();
  for (const c of allCookies) {
    cookieMap.set(c.name, c.value);
  }

  if (newAccessToken) cookieMap.set(ACCESS_TOKEN_COOKIE_NAME, newAccessToken);
  if (newRefreshToken)
    cookieMap.set(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken);

  const cookieHeader = Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

  requestHeaders.set("cookie", cookieHeader);
};

// store the promises based on the refreshToken (store in a map)
const doRefreshToken = ({refreshToken}) => {
  if (refreshTokenPromises.has(refreshToken)) {
    return refreshTokenPromises.get(refreshToken);
  }
  const promise = refreshTokenRequest({refreshToken}).finally(() => {
    refreshTokenPromises.delete(refreshToken!);
  });
  refreshTokenPromises.set(refreshToken, promise);

  return promise;
};

const refreshTokenRequest = async ({refreshToken: prevRefreshToken}) => {
  try {
    const {data} = await refreshTokenAuthRequest(prevRefreshToken);
    const accessToken = data.access_token as string;
    const refreshToken = data.refresh_token as string;

    return {accessToken, refreshToken};
  } catch (e) {
    console.error(e, "failed refreshing in middleware");
    return null;
  }
};
