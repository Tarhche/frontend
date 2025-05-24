"use client";

import { useEffect, useRef } from "react";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { refreshAuthLogic } from "@/lib/auth";
import Cookie from "@/lib/cookie/Cookie";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/constants";
import { clientDalDriver } from "@/dal/client/client-dal-driver";
import {useSearchParams} from "next/navigation";

export function AuthInterceptors() {
  const params = useSearchParams();
  const mockNext401 = useRef(!!params.get('mock401'));

  useEffect(() => {
    const reqId = clientDalDriver.interceptors.request.use(cfg => {
      if (mockNext401.current) {
        mockNext401.current = false;
        return Promise.reject({
          isAxiosError: true,
          response: {
            status: 401,
            data: {},
            headers: {},
            config: cfg,
          },
          config: cfg,
        });
      }
      return cfg;
    });

    createAuthRefreshInterceptor(clientDalDriver, refreshAuthLogic);

    const reqId2 = clientDalDriver.interceptors.request.use(request => {
      const token = new Cookie().get(ACCESS_TOKEN_COOKIE_NAME);
      if (token) {
        request.headers["Authorization"] = `Bearer ${token}`;
      }
      return request;
    });

    return () => {
      clientDalDriver.interceptors.request.eject(reqId);
      clientDalDriver.interceptors.request.eject(reqId2);
    };
  }, []);

  return null;
}
