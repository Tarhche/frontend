import {type Scope} from "./vms/api";

/**
 * What somebody may do with the workload's things, and through which routes.
 *
 * Every action on a VM, a snapshot, a container -- and with it whatever else
 * is in a Docker VM -- or a stack has a permission over anybody's and one over
 * one's own, served on different routes. One's own is asked about through
 * one's own routes when that permission is held -- it is the narrower one, and
 * the API checks it is the caller's -- and through the workload's otherwise.
 * Somebody else's is only ever asked about through the workload's.
 *
 * Which tab a listing is in decides what is listed, never what may be done to
 * what is in it: the same thing may be done to one's own VM from either.
 */
export type WorkloadResource = "vms" | "snapshots" | "containers" | "stacks";

/** The routes an action is asked through, or null when it may not be. */
export function scopeFor(
  permissions: readonly string[],
  resource: WorkloadResource,
  action: string,
  isOwner: boolean,
): Scope | null {
  if (isOwner && permissions.includes(`self.workload.${resource}.${action}`)) {
    return "mine";
  }

  if (permissions.includes(`workload.${resource}.${action}`)) {
    return "all";
  }

  return null;
}

/**
 * The routes one thing is read through on a page of its own. Somebody trusted
 * with anybody's asks for it as anybody's; somebody trusted with only their own
 * asks for it as theirs, and is told it is not there when it is not theirs.
 */
export function readScope(
  permissions: readonly string[],
  resource: WorkloadResource,
): Scope {
  return permissions.includes(`workload.${resource}.show`) ? "all" : "mine";
}
