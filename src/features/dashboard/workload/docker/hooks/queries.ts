import {type Scope} from "../types";

/**
 * Where the VMs read in the browser are kept, the way the VM pages keep theirs
 * (vms/hooks/queries.ts): whatever changes a VM there refreshes the Docker VMs
 * offered here too.
 */
export const vmKeys = {
  all: ["workload", "vms"] as const,
  list: (scope: Scope, params: Record<string, unknown>) =>
    ["workload", "vms", scope, "list", params] as const,
};

/**
 * The keys Docker reads are cached under. Everything starts with the same root,
 * so a change to anything in a VM — a container started, an image pulled — can
 * have every listing that might show it asked for again at once.
 */
export const dockerKeys = {
  root: ["workload", "docker"] as const,
  containers: (scope: Scope, vm?: string) =>
    ["workload", "docker", scope, "containers", vm ?? ""] as const,
  container: (scope: Scope, vmUuid: string, id: string) =>
    ["workload", "docker", scope, "vm", vmUuid, "container", id] as const,
  images: (scope: Scope, vmUuid: string) =>
    ["workload", "docker", scope, "vm", vmUuid, "images"] as const,
  networks: (scope: Scope, vmUuid: string) =>
    ["workload", "docker", scope, "vm", vmUuid, "networks"] as const,
  volumes: (scope: Scope, vmUuid: string) =>
    ["workload", "docker", scope, "vm", vmUuid, "volumes"] as const,
};

/** How often what is on the screen is read again, while it is. */
export const POLL_MS = 5_000;

/** And a listing in which nothing is on its way anywhere. */
export const IDLE_POLL_MS = 30_000;

/**
 * What every read that is asked for again and again shares. A failure is shown
 * where what was read is shown, rather than raised as a notification: the next
 * read is only seconds away, and is the retry.
 */
export const LIVE = {
  retry: false,
  staleTime: 2_000,
  meta: {silent: true},
} as const;
