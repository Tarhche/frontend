"use server";
import axios from "axios";
import {INTERNAL_BACKEND_URL} from "@/constants";
import InterceptorManager from "@/lib/auth/interception/interceptor-manager/InterceptorManager";
import ServerProxyHeaderInterceptor from "@/lib/auth/interception/interceptors/server/ServerProxyHeaderInterceptor";
import ServerAuthInterceptor from "@/lib/auth/interception/interceptors/server/ServerAuthInterceptor";

const BASE_URL = `${INTERNAL_BACKEND_URL}/api`;
export const privateDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

InterceptorManager.create(privateDalDriver)
  .add(ServerAuthInterceptor)
  .add(ServerProxyHeaderInterceptor);
