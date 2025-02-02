import {cookies, headers} from "next/headers";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  USER_PERMISSIONS_COOKIE_NAME,
} from "@/constants/strings";

export async function getRootUrl() {
  const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function getCredentialsFromCookies() {
  const cookiesStore = await cookies();

  return {
    accessToken: cookiesStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    refreshToken: cookiesStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value,
    permissions: cookiesStore.get(USER_PERMISSIONS_COOKIE_NAME)?.value,
  };
}
