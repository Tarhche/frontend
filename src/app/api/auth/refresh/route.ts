import {NextRequest, NextResponse} from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXP,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
} from "@/constants";
import {refreshCoordinator} from "@/lib/auth/refresh/RefreshCoordinator";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return new NextResponse(null, {status: 401});
  }

  try {
    const tokens = await refreshCoordinator.swap(refreshToken);
    const response = new NextResponse(null, {status: 204});
    response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.access_token, {
      maxAge: ACCESS_TOKEN_EXP,
      path: "/",
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
      maxAge: REFRESH_TOKEN_EXP,
      path: "/",
    });
    return response;
  } catch {
    const response = new NextResponse(null, {status: 401});
    response.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
    response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
    return response;
  }
}
