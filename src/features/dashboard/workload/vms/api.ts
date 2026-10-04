import {type VmCommand} from "./types";

/**
 * Whose things a request is asked about: anybody's, under the workload's own
 * permissions, or one's own, under the self ones. The two are served on
 * different routes, and the second answers only about the caller's.
 */
export type Scope = "all" | "mine";

const ROOTS: Record<Scope, string> = {
  all: "dashboard/workload",
  mine: "dashboard/my/workload",
};

export function isScope(value: unknown): value is Scope {
  return value === "all" || value === "mine";
}

/** A path under the workload's part of the dashboard API, for a scope. */
export function workloadPath(scope: Scope, path: string): string {
  return `${ROOTS[scope]}/${path.replace(/^\/+/, "")}`;
}

export function vmsPath(scope: Scope): string {
  return workloadPath(scope, "vms");
}

export function vmPath(scope: Scope, uuid: string): string {
  return `${vmsPath(scope)}/${encodeURIComponent(uuid)}`;
}

/**
 * Where VMs are created. It is the workload's own route whoever asks, and it
 * always creates for the caller.
 */
export function createVmPath(): string {
  return vmsPath("all");
}

export function vmCommandPath(
  scope: Scope,
  uuid: string,
  command: VmCommand,
): string {
  return `${vmPath(scope, uuid)}/${command}`;
}

/** Where a VM is asked to be restored from one of its owner's snapshots. */
export function vmRestorePath(scope: Scope, uuid: string): string {
  return `${vmPath(scope, uuid)}/restore`;
}

export function vmLogsPath(scope: Scope, uuid: string): string {
  return `${vmPath(scope, uuid)}/logs`;
}
