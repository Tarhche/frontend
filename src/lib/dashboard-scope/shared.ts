// Several dashboard sections exist twice: once over everybody's rows (guarded by
// the global `<entity>.*` permissions) and once over the caller's own (guarded by
// `self.<entity>.*`). Both are listed on a single page, one tab per scope, with
// the selected tab carried in the URL.
export type DashboardScope = "all" | "own";

export const SCOPE_PARAM = "scope";

// Tab order, and the order scopes are offered in when several are accessible.
export const DASHBOARD_SCOPES: DashboardScope[] = ["all", "own"];

// Falls back to the first accessible scope, so a `?scope=` the caller can't read
// (hand-typed, or a stale link from before their permissions changed) lands on a
// tab they can.
export function resolveScope(
  requested: string | undefined,
  scopes: DashboardScope[],
): DashboardScope {
  return scopes.find((scope) => scope === requested) ?? scopes[0];
}
