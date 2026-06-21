import {AxiosInstance, InternalAxiosRequestConfig} from "axios";
import {cookies} from "next/headers";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  LANGUAGE_CODE_HEADER,
  LANGUAGE_COOKIE_NAME,
} from "@/constants";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";

export function attachLanguageHeaderServer(dal: AxiosInstance) {
  dal.interceptors.request.use(async (request: InternalAxiosRequestConfig) => {
    if (request.headers.has(LANGUAGE_CODE_HEADER)) {
      return request;
    }

    try {
      const store = await cookies();
      const code = await resolvePreferredLanguageCode({
        accessToken: store.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
        cookieLanguage: store.get(LANGUAGE_COOKIE_NAME)?.value,
      });
      if (code) {
        request.headers.set(LANGUAGE_CODE_HEADER, code);
      }
    } catch {
      // No request scope (e.g. static generation): skip and let the backend
      // resolve the authenticated user's language or the site default.
    }

    return request;
  });
}
