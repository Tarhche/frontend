"use server";

import {cookies, headers} from "next/headers";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/constants/strings";
import {browserFacingOrigin} from "@/lib/request-url";

// Where this site answers, as the browser asked for it: the forwarded headers
// behind Traefik, the Host header otherwise. Empty when nothing says, which
// leaves whoever asked with a relative url — right by definition.
export async function getRootUrl() {
  return browserFacingOrigin(
    await headers(),
    process.env.NODE_ENV === "production",
  );
}

export async function getCredentialsFromCookies() {
  const cookiesStore = await cookies();

  return {
    accessToken: cookiesStore.get(ACCESS_TOKEN_COOKIE_NAME as any)?.value,
    refreshToken: cookiesStore.get(REFRESH_TOKEN_COOKIE_NAME as any)?.value,
  };
}
