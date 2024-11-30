import {dalDriver, fetchUserRoles} from ".";

export async function loginUser(identity: string, password: string) {
  const response = await dalDriver.post("auth/login", {
    identity: identity,
    password: password,
  });

  if (response.status === 200) {
    const roles = await fetchUserRoles({
      headers: {
        Authorization: `Bearer ${response.data.access_token}`,
      },
    });
    return {
      ...response.data,
      permissions: Array.from(
        new Set(roles.items.flatMap((item: any) => item.permissions)),
      ),
    };
  }
}

export async function registerUser(identity: string) {
  return await dalDriver.post("auth/register", {
    identity: identity,
  });
}

export async function verifyUser(data: Record<string, string>) {
  return await dalDriver.post("auth/verify", data);
}

export const REFRESH_TOKEN_URL = "auth/token/refresh";
export async function refreshToken(refreshToken: string) {
  return await dalDriver.post(REFRESH_TOKEN_URL, {
    token: refreshToken,
  });
}

export async function forgotPassword(identity: string) {
  return await dalDriver.post("auth/password/forget", {
    identity,
  });
}

export async function resetPassword(password: string, token: string) {
  return await dalDriver.post("auth/password/reset", {
    password,
    token,
  });
}
