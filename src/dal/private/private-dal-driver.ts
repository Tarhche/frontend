"use server";

import axios from "axios";
import {INTERNAL_BACKEND_URL} from "@/constants";
import InterceptorManager from "@/lib/auth/interception/interceptor-manager/InterceptorManager";
import ServerPublicInterceptor from "@/lib/auth/interception/interceptors/server/ServerPublicInterceptor";
import ServerProxyHeaderInterceptor from "@/lib/auth/interception/interceptors/server/ServerProxyHeaderInterceptor";
import {attachAuthHeaderServer} from "@/lib/auth/dal/attachAuthHeaderServer";
import {attachLanguageHeaderServer} from "@/lib/auth/dal/attachLanguageHeaderServer";

const BASE_URL = `${INTERNAL_BACKEND_URL}/api`;

export const privateDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

attachAuthHeaderServer(privateDalDriver);
attachLanguageHeaderServer(privateDalDriver);

InterceptorManager.create(privateDalDriver)
  .add(ServerPublicInterceptor)
  .add(ServerProxyHeaderInterceptor);
