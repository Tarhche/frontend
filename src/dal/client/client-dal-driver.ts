import axios from "axios";
import {PUBLIC_BACKEND_URL} from "@/constants";
import InterceptorManager from "@/lib/auth/interception/interceptor-manager/InterceptorManager";
import ClientAuthInterceptor from "@/lib/auth/interception/interceptors/client/ClientAuthInterceptor";

const BASE_URL = `${PUBLIC_BACKEND_URL}/api`;
const clientDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

InterceptorManager.create(clientDalDriver).add(ClientAuthInterceptor);

export {clientDalDriver};
