import {hasPermission} from "@/lib/auth/shared";
import {type Scope} from "@/features/dashboard/workload/vms/api";

/** What a person may do with the stacks in a scope. There is no editing one. */
export type StackMay = {
  own: boolean;
  manage: boolean;
  delete: boolean;
};

export function stackMay(permissions: string[], scope: Scope): StackMay {
  const own = scope === "mine";
  const prefix = own ? "self.workload.stacks" : "workload.stacks";

  return {
    own,
    manage: hasPermission(permissions, [`${prefix}.manage`]),
    delete: hasPermission(permissions, [`${prefix}.delete`]),
  };
}

/**
 * The scope a single stack is asked for in: everybody's for whoever may see
 * everybody's, one's own otherwise, where somebody else's is not found.
 */
export function stackScope(permissions: string[]): Scope {
  return hasPermission(permissions, ["workload.stacks.show"]) ? "all" : "mine";
}

/** Whether a scope's stacks may be listed, which linking to them takes. */
export function stacksVisible(permissions: string[], scope: Scope): boolean {
  return hasPermission(permissions, [
    scope === "mine" ? "self.workload.stacks.index" : "workload.stacks.index",
  ]);
}
