import {scopeFor} from "@/features/dashboard/workload/permissions";
import {type Scope} from "@/features/dashboard/workload/vms/api";

/**
 * What somebody may do with what is in a Docker VM, and through which routes:
 * one's own through one's own routes when that permission is held, anybody's
 * through the workload's (../permissions.ts). What is in a VM is its owner's,
 * so whose it is is whose the VM is.
 *
 * The containers' permissions cover the images, networks and volumes of the
 * same VMs.
 */
export type DockerAbilities = {
  /** listing what is in it: containers, images, networks, volumes. */
  index: Scope | null;

  /** reading one container, its usage included. */
  show: Scope | null;

  /**
   * starting, stopping and restarting a container, joining and leaving
   * networks, and pulling an image or creating a network or a volume: what
   * changes a VM the way starting a container does.
   */
  manage: Scope | null;

  /** removing a container, an image, a network or a volume. */
  delete: Scope | null;
  logs: Scope | null;
};

export function dockerAbilities(
  permissions: readonly string[],
  isOwner: boolean,
): DockerAbilities {
  return {
    index: scopeFor(permissions, "containers", "index", isOwner),
    show: scopeFor(permissions, "containers", "show", isOwner),
    manage: scopeFor(permissions, "containers", "manage", isOwner),
    delete: scopeFor(permissions, "containers", "delete", isOwner),
    logs: scopeFor(permissions, "containers", "logs", isOwner),
  };
}
