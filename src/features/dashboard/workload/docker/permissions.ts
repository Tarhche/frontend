import {hasPermission} from "@/lib/auth/shared";
import {type Scope} from "@/features/dashboard/workload/vms/api";

/**
 * What a person may do with the Docker objects in a scope.
 *
 * Containers' permissions cover the images, networks and volumes of the same
 * VMs. Pulling an image, or creating a network or a volume, changes a VM the
 * way starting a container does, so it is the manage permission that allows
 * it; removing any of them is the delete one.
 */
export type DockerMay = {
  own: boolean;
  manage: boolean;
  delete: boolean;
  logs: boolean;
};

export function dockerMay(permissions: string[], scope: Scope): DockerMay {
  const own = scope === "mine";
  const prefix = own ? "self.workload.containers" : "workload.containers";

  return {
    own,
    manage: hasPermission(permissions, [`${prefix}.manage`]),
    delete: hasPermission(permissions, [`${prefix}.delete`]),
    logs: hasPermission(permissions, [`${prefix}.logs`]),
  };
}

/**
 * The scope a single container is asked for in: somebody trusted with
 * everybody's asks for it as anybody's; somebody trusted with only their own
 * asks for it as theirs, and is told it does not exist when it is not.
 */
export function containerScope(permissions: string[]): Scope {
  return hasPermission(permissions, ["workload.containers.show"])
    ? "all"
    : "mine";
}
