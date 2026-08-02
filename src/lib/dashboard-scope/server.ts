import {getUserPermissions, hasPermission} from "@/lib/auth";
import {type Permissions} from "@/lib/app-permissions";
import {DASHBOARD_SCOPES, type DashboardScope} from "./shared";

export type ScopePermissions = {
  [S in DashboardScope]: Permissions;
};

// The scopes the caller may list, in tab order. Empty when they hold neither
// permission — the page guard turns that into the access-denied screen before
// this ever renders.
export async function accessibleScopes(
  permissions: ScopePermissions,
): Promise<DashboardScope[]> {
  const userPermissions = await getUserPermissions();

  if (userPermissions === null) {
    return [];
  }

  return DASHBOARD_SCOPES.filter((scope) =>
    hasPermission(userPermissions, [permissions[scope]]),
  );
}
