import ServerInterceptor from "@/lib/auth/interception/interceptors/ServerInterceptor";
import {InternalAxiosRequestConfig} from "axios";
import {headers as nextHeaders} from "next/headers";

export default class ServerProxyHeaderInterceptor extends ServerInterceptor {
  add() {
    this.dal.interceptors.request.use(
      this.handleRequestResolveXForwardedForHeader,
      async (error) => error,
    );
  }

  async handleRequestResolveXForwardedForHeader(config: InternalAxiosRequestConfig) {
    try {
      const headersStore = await nextHeaders();
      config.headers["x-forwarded-for"] =
        headersStore.get("x-forwarded-for") ||
        headersStore.get("x-real-ip") ||
        headersStore.get("cf-connecting-ip");
    } catch (e) {
      // avoid errors on static generation
    }

    return config;
  }
}
