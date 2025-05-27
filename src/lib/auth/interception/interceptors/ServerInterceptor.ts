import Interceptor from "./Interceptor";
import {AxiosInstance} from "axios";
import ServerCookieManager from "@/lib/cookie/server/ServerCookieManager";
import {redirect} from "next/navigation";

export default abstract class ServerInterceptor extends Interceptor {
  cookieManager: ServerCookieManager;

  constructor(dal: AxiosInstance) {
    super(dal);
    this.cookieManager = new ServerCookieManager();
  }

  public abstract add();

  public redirect(url: string) {
    redirect(url);
  }
}
