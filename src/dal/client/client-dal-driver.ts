import axios from "axios";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  PUBLIC_BACKEND_URL,
} from "@/constants";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import {refreshAuthLogic} from "@/lib/auth";
import Cookie from "@/lib/cookie/Cookie";

const BASE_URL = `${PUBLIC_BACKEND_URL}/api`;
const clientDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

if (typeof window !== 'undefined') {
  createAuthRefreshInterceptor(clientDalDriver, refreshAuthLogic);

  clientDalDriver.interceptors.request.use((request) => {
    request.headers['Authorization'] = `Bearer ${(new Cookie()).get(ACCESS_TOKEN_COOKIE_NAME)}`;
    return request;
  });
}


export {clientDalDriver}
