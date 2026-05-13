"use server";

import axios from "axios";
import {INTERNAL_BACKEND_URL} from "@/constants";
import InterceptorManager from "@/lib/auth/interception/interceptor-manager/InterceptorManager";
import ServerPublicInterceptor from "@/lib/auth/interception/interceptors/server/ServerPublicInterceptor";
import ServerProxyHeaderInterceptor from "@/lib/auth/interception/interceptors/server/ServerProxyHeaderInterceptor";
import {attachAuthHeaderServer} from "@/lib/auth/dal/attachAuthHeaderServer";

const BASE_URL = `${INTERNAL_BACKEND_URL}/api`;

export const privateDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

attachAuthHeaderServer(privateDalDriver);

InterceptorManager.create(privateDalDriver)
  .add(ServerPublicInterceptor)
  .add(ServerProxyHeaderInterceptor);
