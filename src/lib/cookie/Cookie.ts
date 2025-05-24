import JsCookie from 'js-cookie'
import CookieOptions from "@/lib/cookie/types/CookieOptions";

export default class Cookie {
  cookieManager: typeof JsCookie;
  constructor() {
    this.cookieManager = JsCookie;
  }

  set(key: string, value: string, options: CookieOptions) {
    const sanitizedOptions = Object.entries(options).reduce((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>);

    JsCookie.set(key, value, sanitizedOptions);
  }

  get(key: string) {
    return this.cookieManager.get(key);
  }

  remove(key: string) {
    return this.cookieManager.remove(key);
  }
}
