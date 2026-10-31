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
    // a promise is truthy whatever it resolves to, so a missing await here made
    // everybody logged in
    (await isUserTokenValid("refresh-token"))
  );
}

export async function getUserPermissions(): Promise<string[] | null> {
  const {accessToken} = await getCredentialsFromCookies();
  const token = decodeJWT(accessToken || "");
  const permissions = token?.permissions;

  return permissions || null;
}

/**
 * Who this session acts as: the token's subject. That is the person something
 * is "their own" to, which is what a node compares an owner with too.
 */
export async function getUserUuid(): Promise<string | null> {
  const {accessToken} = await getCredentialsFromCookies();

  return decodeJWT(accessToken || "")?.sub || null;
}
