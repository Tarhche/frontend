import {type Author} from "@/features/authors/types";
import {type VmKind} from "@/features/dashboard/workload/vms/types";

/** Where a snapshot is: being taken, ready to restore from, or neither. */
export type SnapshotState = "creating" | "ready" | "failed" | "deleting";

/**
 * A copy of a VM's disk, kept apart from the VM: it outlives the VM it was
 * taken of, and is restored onto that VM, another of its owner's VMs of the
 * same kind, or a new one.
 */
export type Snapshot = {
  uuid: string;
  name: string;
  owner_uuid: string;

  /** Where it was taken. The VM may be gone since. */
  vm_uuid: string;
  vm_name: string;
  kind: VmKind;
  image: string;

  /** The disk a VM it is restored onto needs at least, in bytes. */
  disk: number;

  /** What took it; a restore needs the same engine. */
  engine?: string;

  /** What it takes to keep, in bytes. */
  size: number;
  state: SnapshotState;

  /** Why it failed. */
  reason?: string;
  created_at: string;
  completed_at?: string | null;

  /** Who it belongs to, when the API says more than the uuid. */
  owner?: Partial<Author>;
};

/** Which snapshots a listing is of. */
export type SnapshotListParams = {
  page?: number | string;

  /** Only those taken of this VM. */
  vm?: string;
};
