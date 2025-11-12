"use server";
import axios from "axios";
import {INTERNAL_BACKEND_URL} from "@/constants";
import InterceptorManager from "@/lib/auth/interception/interceptor-manager/InterceptorManager";
import ServerPublicInterceptor from "@/lib/auth/interception/interceptors/server/ServerPublicInterceptor";

const BASE_URL = `${INTERNAL_BACKEND_URL}/api`;

export const cacheableDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

InterceptorManager.create(cacheableDalDriver)
  .add(ServerPublicInterceptor);
