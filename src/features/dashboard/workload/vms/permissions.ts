import {scopeFor} from "@/features/dashboard/workload/permissions";
import {type Scope} from "./api";

/**
 * What somebody may do to a VM, and through which routes: one's own through
 * one's own routes when that permission is held, anybody's through the
 * workload's, as with everything in the workload (../permissions.ts).
 */

export type VmAction =
  "index" | "show" | "update" | "delete" | "manage" | "logs" | "attach";

/** The routes an action is asked through, or null when it may not be. */
export function vmScope(
  permissions: readonly string[],
  action: VmAction,
  isOwner: boolean,
): Scope | null {
  return scopeFor(permissions, "vms", action, isOwner);
}

export type VmAbilities = {
  show: Scope | null;
  update: Scope | null;
  delete: Scope | null;

  /** Starting, stopping, restarting and restoring it. */
  manage: Scope | null;
  logs: Scope | null;

  /**
   * Whether a terminal can be opened in it. The node lets nobody but the owner
   * in, whatever else they may do, so it is never somebody else's.
   */
  attach: boolean;

  /**
   * Whether a snapshot can be taken of it. Snapshots are made through the
   * workload's own route, always for the caller, so only of one's own VM.
   */
  snapshot: boolean;
};

export function vmAbilities(
  permissions: readonly string[],
  isOwner: boolean,
): VmAbilities {
  return {
    show: vmScope(permissions, "show", isOwner),
    update: vmScope(permissions, "update", isOwner),
    delete: vmScope(permissions, "delete", isOwner),
    manage: vmScope(permissions, "manage", isOwner),
    logs: vmScope(permissions, "logs", isOwner),
    attach: isOwner && vmScope(permissions, "attach", isOwner) !== null,
    snapshot: isOwner && permissions.includes("workload.snapshots.create"),
  };
}

/** Whether somebody may create VMs, which are always their own. */
export function canCreateVms(permissions: readonly string[]): boolean {
  return permissions.includes("workload.vms.create");
}

/**
 * Where VMs to pick one from are listed: a scope's routes, narrowed to one
 * owner's VMs when the workload's routes stand in for somebody's own.
 */
export type VmSource = {
  scope: Scope;
  owner?: string;
};

/**
 * Where somebody lists VMs to pick one of. Everybody's are listed through the
 * workload's routes, for whoever may list them. One's own are listed through
 * one's own routes, or through the workload's narrowed to one's own when that
 * is all that is held. Null when they may not be listed at all, and nothing
 * can be picked.
 */
export function vmSource(
  permissions: readonly string[],
  whose: Scope,
  me: string | null,
): VmSource | null {
  if (whose === "all") {
    return vmScope(permissions, "index", false) ? {scope: "all"} : null;
  }

  const scope = vmScope(permissions, "index", true);
  if (scope === "mine") {
    return {scope};
  }

  return scope === "all" && me ? {scope, owner: me} : null;
}
