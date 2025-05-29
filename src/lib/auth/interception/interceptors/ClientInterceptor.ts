import Interceptor from "./Interceptor";
import {AxiosInstance} from "axios";
import ClientCookieManager from "@/lib/cookie/client/ClientCookieManager";

export default abstract class ClientInterceptor extends Interceptor {
  cookieManager: ClientCookieManager;

  constructor(dal: AxiosInstance) {
    super(dal);
    this.cookieManager = new ClientCookieManager();
  }

  public abstract add();

  public redirect(url: string) {
    window.location.href = url;
  }
}
