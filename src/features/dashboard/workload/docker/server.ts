import "server-only";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {getCredentialsFromCookies} from "@/lib/http";
import {sessionClaims} from "@/lib/accounts/session";
import {type Scope, type VmSource} from "./types";

/** Who is asking: the subject of their own session. */
async function currentUserUuid(): Promise<string | null> {
  const {accessToken} = await getCredentialsFromCookies();

  return sessionClaims(accessToken)?.sub ?? null;
}

/**
 * Where the Docker VMs a page offers are listed from.
 *
 * Everybody's VMs are listed through the admin routes, for whoever may list
 * them. One's own are listed through the "my" routes; somebody who may list
 * everybody's but not, as such, their own gets everybody's narrowed to theirs.
 * Somebody who may list neither has nothing to pick from, and is told so.
 */
export async function dockerVmSource(
  scope: Scope,
  permissions?: string[],
): Promise<VmSource | null> {
  const granted = permissions ?? (await getUserPermissions()) ?? [];

  if (scope === "all") {
    return hasPermission(granted, ["workload.vms.index"])
      ? {scope: "all"}
      : null;
  }

  if (hasPermission(granted, ["self.workload.vms.index"])) {
    return {scope: "mine"};
  }

  if (hasPermission(granted, ["workload.vms.index"])) {
    const owner = await currentUserUuid();

    return owner ? {scope: "all", owner} : null;
  }

  return null;
}
