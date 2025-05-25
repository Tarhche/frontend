import axios, {AxiosResponse} from "axios";
import Cookie from "@/lib/cookie/Cookie";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXP,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
} from "@/constants";
import {refreshToken as refreshTokenRequest} from "@/dal/public/auth";

export const refreshAuthLogic = (failedRequest: { response: AxiosResponse }) => {
  return new Promise((resolve, reject) => {
    const cookieStore = new Cookie();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME);
    if (!refreshToken) {
      cookieStore.remove(ACCESS_TOKEN_COOKIE_NAME);
      window.location.href = '/auth/login';
    }
    refreshTokenRequest(refreshToken as string).then(response => {
      const {access_token, refresh_token} = response.data;
      failedRequest.response.config.headers['Authorization'] = 'Bearer ' + access_token;
      cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, access_token, {
        maxAge: ACCESS_TOKEN_EXP,
        path: '/',
      });
      cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, refresh_token, {
        maxAge: REFRESH_TOKEN_EXP,
        path: '/',
      });

      return resolve(true);
    }).catch(e => {
      cookieStore.remove(ACCESS_TOKEN_COOKIE_NAME);
      cookieStore.remove(REFRESH_TOKEN_COOKIE_NAME);
      window.location.href = '/auth/login';
      reject(e);
    });
  })
}
