import jwt from "jsonwebtoken";
import {getCredentialsFromCookies} from "../http";
import {AuthTokenPayload} from "@/lib/auth/types";

function decodeJWT(token: string): AuthTokenPayload | null {
  return jwt.decode(token ?? "", {
    json: true,
  }) as AuthTokenPayload | null;
}

/**
  This function retrieves the access or refresh token from cookies and verifies its validity
*/
export async function isUserTokenValid(type: "access-token" | "refresh-token") {
  const {accessToken, refreshToken} = await getCredentialsFromCookies();

  if (type === "access-token") {
    const token = decodeJWT(accessToken || "");
    return token !== null && Date.now() < token.exp! * 1000;
  } else if (type === "refresh-token") {
    const token = decodeJWT(refreshToken || "");
    return token !== null && Date.now() < token.exp! * 1000;
  }
}

export async function isUserLoggedIn() {
  return (
    (await isUserTokenValid("access-token")) ||
    isUserTokenValid("refresh-token")
  );
}

export async function getUserPermissions(): Promise<string[] | null> {
  const {accessToken} = await getCredentialsFromCookies();
  const token = decodeJWT(accessToken || "");
  const permissions = token?.permissions;

  return permissions || null;
}
