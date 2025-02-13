import jwt from "jsonwebtoken";
import {getCredentialsFromCookies} from "../http";

export function decodeJWT(token: string) {
  return jwt.decode(token ?? "", {
    json: true,
  });
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

export async function getUserPermissions(): Promise<string[]> {
  const {permissions} = await getCredentialsFromCookies();
  // "W10=" is equal to "[]"
  return JSON.parse(atob(permissions || "W10="));
}
