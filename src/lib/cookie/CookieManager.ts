import CookieOptions from "./types/CookieOptions";

export default abstract class CookieManager {
  public abstract set(key: string, value: string, options: CookieOptions);

  public abstract get(key: any): any;

  public abstract remove(key: any): any;

  public abstract has(key: any): Promise<boolean>;

  public abstract canSetCookie(): Promise<boolean>;
}
