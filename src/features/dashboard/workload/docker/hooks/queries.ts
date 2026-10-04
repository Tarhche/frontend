import {type Scope} from "../types";

/**
 * The keys Docker reads are cached under. Everything starts with the same root,
 * so a change to anything in a VM — a container started, an image pulled — can
 * have every listing that might show it asked for again at once.
 */
export const dockerKeys = {
  root: ["workload", "docker"] as const,
  vms: (scope: Scope, owner?: string) =>
    ["workload", "docker", scope, "vms", owner ?? ""] as const,
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

/**
 * Asks again every so often, until an answer fails. A failure is said once —
 * by the app's notice and by whatever shows the data — rather than every few
 * seconds, and asking again is then left to the person reading.
 */
export function pollUntilFailed(every: number | false) {
  return (query: {state: {status: string}}) =>
    query.state.status === "error" ? false : every;
}
