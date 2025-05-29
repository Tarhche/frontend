import {AxiosInstance} from "axios";
import CookieManager from "@/lib/cookie/CookieManager";

export default abstract class Interceptor {
  dal: AxiosInstance;
  cookieManager!: CookieManager;
  constructor(dal: AxiosInstance) {
    this.dal = dal;
  }

  public abstract add();

  abstract redirect(url: string): void;
}
