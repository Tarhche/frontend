"use client";
import { useEffect, useRef } from "react";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { refreshAuthLogic } from "@/lib/auth";
import Cookie from "@/lib/cookie/Cookie";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";
import {clientDalDriver} from "@/dal/client/client-dal-driver";

export function AuthInterceptors() {
  const mockNext401 = useRef(false);

  useEffect(() => {
    const reqId = clientDalDriver.interceptors.request.use(cfg => {
      if (mockNext401.current) {
        mockNext401.current = false;
        cfg.headers["x-mock-401"] = "true";
      }
      return cfg;
    });

    const resId = clientDalDriver.interceptors.response.use(
      res => {
        if (res.config.headers["x-mock-401"]) {
          return Promise.reject({
            response: { status: 401, config: res.config },
            isAxiosError: true,
          });
        }
        return res;
      },
      err => Promise.reject(err)
    );

    createAuthRefreshInterceptor(clientDalDriver, refreshAuthLogic);

    const reqId2 = clientDalDriver.interceptors.request.use((request) => {
      request.headers['Authorization'] = `Bearer ${(new Cookie()).get(ACCESS_TOKEN_COOKIE_NAME)}`;
      return request;
    });

    return () => {
      clientDalDriver.interceptors.request.eject(reqId);
      clientDalDriver.interceptors.request.eject(reqId2);
      clientDalDriver.interceptors.response.eject(resId);
    };
  }, []);

  return null;
}
