import {publicDalDriver} from "./public-dal-driver";

export async function loginUser(identity: string, password: string) {
  const response = await publicDalDriver.post("auth/login", {
    identity: identity,
    password: password,
  });

  return response.data;
}

// what may be signed in with here. A provider the backend was not configured
// with is not in the list, so nothing draws a button that cannot work.
export async function fetchLoginProviders() {
  const response = await publicDalDriver.get("auth/oauth");

  return response.data;
}

// where to send the browser to be asked who it is, and the state to compare
// when it comes back.
export async function fetchProviderAuthorization(provider: string) {
  const response = await publicDalDriver.get(`auth/oauth/${provider}`);

  return response.data;
}

// the other half: the code the provider handed the browser, traded for a
// session of ours.
export async function loginWithProvider(provider: string, code: string) {
  const response = await publicDalDriver.post("auth/login", {provider, code});

  return response.data;
}

export async function registerUser(identity: string) {
  return await publicDalDriver.post("auth/register", {
    identity: identity,
  });
}

export async function verifyUser(data: Record<string, string>) {
  return await publicDalDriver.post("auth/verify", data);
}

export async function forgotPassword(identity: string) {
  return await publicDalDriver.post("auth/password/forget", {
    identity,
  });
}

export async function resetPassword(password: string, token: string) {
  return await publicDalDriver.post("auth/password/reset", {
    password,
    token,
  });
}
