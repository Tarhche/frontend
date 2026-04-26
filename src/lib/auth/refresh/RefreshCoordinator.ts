import {NewTokens, refreshTokens} from "./refreshTokens";

const TTL_MS = 15_000;

class RefreshCoordinator {
  private inFlight = new Map<string, Promise<NewTokens>>();
  private recentlyRotated = new Map<string, NewTokens>();

  async swap(oldRefreshToken: string): Promise<NewTokens> {
    const cached = this.recentlyRotated.get(oldRefreshToken);
    if (cached) return cached;

    const inflight = this.inFlight.get(oldRefreshToken);
    if (inflight) return inflight;

    const promise = refreshTokens(oldRefreshToken)
      .then((tokens) => {
        this.remember(oldRefreshToken, tokens);
        this.remember(tokens.refresh_token, tokens);
        return tokens;
      })
      .finally(() => {
        this.inFlight.delete(oldRefreshToken);
      });

    this.inFlight.set(oldRefreshToken, promise);
    return promise;
  }

  private remember(key: string, tokens: NewTokens) {
    this.recentlyRotated.set(key, tokens);
    setTimeout(() => {
      const current = this.recentlyRotated.get(key);
      if (current === tokens) this.recentlyRotated.delete(key);
    }, TTL_MS);
  }
}

const globalKey = Symbol.for("refreshCoordinator.singleton");
type GlobalWithCoordinator = typeof globalThis & {
  [globalKey]?: RefreshCoordinator;
};
const g = globalThis as GlobalWithCoordinator;

export const refreshCoordinator: RefreshCoordinator =
  g[globalKey] ?? (g[globalKey] = new RefreshCoordinator());
