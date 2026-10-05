import {type Scope} from "@/features/dashboard/workload/vms/api";

/**
 * The keys Docker reads are cached under. Everything starts with the same root,
 * so a change to anything in a VM — a container started, an image pulled — can
 * have every listing that might show it asked for again at once.
 *
 * The Docker VMs themselves are cached as every VM is (vms/hooks/queries.ts),
 * so whatever changes a VM there refreshes the ones offered here too.
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
