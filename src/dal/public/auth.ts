import {publicDalDriver} from "./public-dal-driver";
import {PUBLIC_BACKEND_URL} from "@/constants";
import axios from "axios";

export async function loginUser(identity: string, password: string) {
  const response = await publicDalDriver.post("auth/login", {
    identity: identity,
    password: password,
  });

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

export async function refreshToken(refreshToken: string) {
  return axios.post(`${PUBLIC_BACKEND_URL}/api/auth/token/refresh`, {
    token: refreshToken,
  });
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
