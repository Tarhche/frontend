import {scopeFor} from "@/features/dashboard/workload/permissions";
import {type Scope} from "@/features/dashboard/workload/vms/api";

/**
 * What somebody may do to a stack, and through which routes: one's own
 * through one's own routes when that permission is held, anybody's through the
 * workload's (../permissions.ts). There is no editing one.
 */
export type StackAbilities = {
  show: Scope | null;

  /** starting, stopping and restarting it. */
  manage: Scope | null;
  delete: Scope | null;
};

export function stackAbilities(
  permissions: readonly string[],
  isOwner: boolean,
): StackAbilities {
  return {
    show: scopeFor(permissions, "stacks", "show", isOwner),
    manage: scopeFor(permissions, "stacks", "manage", isOwner),
    delete: scopeFor(permissions, "stacks", "delete", isOwner),
  };
}
