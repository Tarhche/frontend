import JsCookie from 'js-cookie'
import CookieOptions from "@/lib/cookie/types/CookieOptions";
import CookieManager from "../CookieManager";

export default class ClientCookieManager extends CookieManager {
  cookieManager: typeof JsCookie;
  constructor() {
    super();
    this.cookieManager = JsCookie;
  }

  async set(key: string, value: string, options: CookieOptions) {
    const sanitizedOptions = Object.entries(options).reduce((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>);

    JsCookie.set(key, value, sanitizedOptions);
  }

  async get(key: string) {
    return this.cookieManager.get(key);
  }

  async remove(key: string) {
    return this.cookieManager.remove(key);
  }

  async has(key: string) {
    return Boolean(this.cookieManager.get(key));
  }

  async canSetCookie() {
    return true;
  }
}
