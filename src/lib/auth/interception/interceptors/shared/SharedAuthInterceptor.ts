import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXP, INTERNAL_BACKEND_URL,
  PUBLIC_BACKEND_URL,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXP, USER_PERMISSIONS_COOKIE_NAME,
} from "@/constants";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import axios, {AxiosInstance, AxiosResponse} from "axios";
import Interceptor from "../Interceptor";

export default class SharedAuthInterceptor extends Interceptor {
  baseInterceptor: Interceptor;
  refreshedAccessToken = null;

  constructor(dal: AxiosInstance, baseInterceptor: Interceptor) {
    super(dal);
    this.baseInterceptor = baseInterceptor;
  }

  add() {
    createAuthRefreshInterceptor(this.dal, this.refreshAuthLogic.bind(this));

    this.dal.interceptors.request.use(async (request) => {
      const accessToken = await this.baseInterceptor.cookieManager.get(ACCESS_TOKEN_COOKIE_NAME);
      if (this.refreshedAccessToken) {
        request.headers['Authorization'] = `Bearer ${this.refreshedAccessToken}`;
      } else if (accessToken) {
        request.headers['Authorization'] = `Bearer ${await this.baseInterceptor.cookieManager.get(ACCESS_TOKEN_COOKIE_NAME)}`;
      }
      return request;
    });
  }

  protected async refreshAuthLogic(failedRequest: { response: AxiosResponse }) {
    return new Promise(async (resolve, reject) => {
      try {
        const refreshToken = await this.baseInterceptor.cookieManager.get(REFRESH_TOKEN_COOKIE_NAME);
        if (!refreshToken) {
          await this.baseInterceptor.cookieManager.remove(ACCESS_TOKEN_COOKIE_NAME);
          this.baseInterceptor.redirect('/auth/login');
        }
        const BASE_URL = `${PUBLIC_BACKEND_URL}/api`;
        axios.post(`${BASE_URL}/auth/token/refresh`, {
          token: refreshToken,
        }).then(response => {
          const {access_token, refresh_token} = response.data;

          failedRequest.response.config.headers['Authorization'] = 'Bearer ' + access_token;
          this.baseInterceptor.cookieManager.canSetCookie().then(async (canSetCookie) => {
            try {
              if (canSetCookie) {
                await this.baseInterceptor.cookieManager.set(ACCESS_TOKEN_COOKIE_NAME, access_token, {
                  maxAge: ACCESS_TOKEN_EXP,
                  path: '/',
                });
                await this.baseInterceptor.cookieManager.set(REFRESH_TOKEN_COOKIE_NAME, refresh_token, {
                  maxAge: REFRESH_TOKEN_EXP,
                  path: '/',
                });
                axios.get(`${INTERNAL_BACKEND_URL}/api/dashboard/profile/roles`, {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                }).then((res) => {
                  const userRoles = res.data
                  this.baseInterceptor.cookieManager.set(
                    USER_PERMISSIONS_COOKIE_NAME,
                    btoa(
                      JSON.stringify(
                        Array.from(
                          new Set(
                            userRoles.items.flatMap((item: any) => item.permissions),
                          ),
                        ),
                      ),
                    ),
                    {
                      maxAge: REFRESH_TOKEN_EXP,
                    },
                  ).then(() => {
                    resolve(true);
                  }).catch((e) => {
                    console.error(e)
                    reject()
                  });
                }).finally(() => {
                  resolve(true);
                }).catch(e => {
                  reject(e);
                })
              } else {
                // force the server to read from the variable because we cannot set cookie in this request
                this.refreshedAccessToken = access_token;
                resolve(true);
              }
            } catch (e) {
              reject(e)
            }
          })
        }).catch(async e => {
          try {
            await this.unsetCookies();
            this.baseInterceptor.redirect('/auth/login');
            reject(e);
          } catch (e) {
            this.unsetCookies().finally(() => {
              reject(e);
            })
          }
        });
      } catch (e) {
        this.unsetCookies().finally(() => {
          reject(e);
        });
      }
    })
  }

  async unsetCookies() {
    await this.baseInterceptor.cookieManager.remove(ACCESS_TOKEN_COOKIE_NAME);
    await this.baseInterceptor.cookieManager.remove(REFRESH_TOKEN_COOKIE_NAME);
  }

  redirect(url: string) {
    return this.baseInterceptor.redirect(url);
  }
}
