import { cookies } from 'next/headers';
import CookieOptions from "../types/CookieOptions";
import CookieManager from "../CookieManager";
import {headers as nextHeaders} from "next/dist/server/request/headers";

export default class ServerCookieManager extends CookieManager {
  protected async getStore() {
    return await cookies();
  }

  async set(key: any, value: any, options: CookieOptions = {}) {
    (await this.getStore()).set(key, value, options as any);
  }

  async get(key: any) {
    return (await this.getStore()).get(key)?.value;
  }

  async remove(key: any) {
    (await this.getStore()).delete(key);
  }

  async has(key: string) {
    return (await this.getStore()).has(key);
  }

  async canSetCookie() {
    const headersStore = await nextHeaders();
    const isFromApiRoutes = headersStore.has("client-to-proxy");
    const isFromServerAction = headersStore.has("next-action");

    return isFromApiRoutes || isFromServerAction;
  }
}
