import "server-only";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {
  type VmSource,
  vmSource,
} from "@/features/dashboard/workload/vms/permissions";

/**
 * Where the Docker VMs a page offers are listed from, by the VM pages' own
 * rule (vmSource): everybody's for whoever may list them, one's own through
 * one's own routes or through the workload's narrowed to one's own. Somebody
 * who may list neither has nothing to pick from, and is told so.
 */
export async function dockerVmSource(
  scope: Scope,
  permissions?: string[],
): Promise<VmSource | null> {
  const granted = permissions ?? (await getUserPermissions()) ?? [];

  return vmSource(
    granted,
    scope,
    scope === "mine" ? await getUserUuid() : null,
  );
}
