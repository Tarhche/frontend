import {type Author} from "@/features/authors/types";

/**
 * What a VM is booted as: an OS image with nothing running in it but what is
 * started there, or the Docker image with dockerd running, which is what
 * containers and stacks are run in.
 */
export type VmKind = "machine" | "docker";

export const VM_KINDS: readonly VmKind[] = ["machine", "docker"];

/** Whether traffic one way is let through at all. */
export type Access = "allow" | "deny";

/**
 * How much of the network a VM has. Nothing ever lets one VM reach another.
 *
 * Ingress allowed, its ports are reachable through the ingress; denied, nothing
 * reaches it. Egress allowed, it reaches the public internet -- never private
 * ranges, the host or other VMs; denied, it reaches nothing at all.
 */
export type VmNetwork = {
  ingress: Access;
  egress: Access;
};

/** What a VM is given: whole vCPUs, and memory and disk in bytes. */
export type VmResources = {
  cpus: number;
  memory: number;
  disk: number;
};

/**
 * Where a VM is. Created, scheduled, starting, restarting, restoring, stopping
 * and deleting are on the way somewhere; the rest are where it is.
 */
export type VmState =
  | "created"
  | "scheduled"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "restarting"
  | "restoring"
  | "failed"
  | "deleting";

/** The last sample its node reported. Bytes, and a percentage of its CPUs. */
export type VmStats = {
  cpu_percent: number;
  memory_used: number;
  memory_limit: number;
  disk_used: number;
  disk_total: number;
  network_rx: number;
  network_tx: number;
  sampled_at: string;
};

/** Where one of its ports is served, when its ingress is allowed. */
export type VmUrl = {
  port: number;
  url: string;
};

/** One VM, as the dashboard API presents it. */
export type Vm = {
  uuid: string;
  name: string;
  slug: string;
  owner_uuid: string;
  kind: VmKind;

  /** An OCI reference. A Docker VM's is the workload's own dind image. */
  image: string;
  resources: VmResources;

  /** Guest ports exposed through the ingress, sorted and unique. */
  ports: number[] | null;
  network: VmNetwork;

  /** Kept between starts; otherwise the disk is pristine on every start. */
  persistent_disk: boolean;

  /** 0 keeps it until it is deleted; otherwise it is deleted at expires_at. */
  lifetime_seconds: number;
  expires_at?: string | null;

  state: VmState;
  expected_state?: VmState;

  /** Why it failed, or what is pending. */
  reason?: string;
  node_name?: string;
  stats?: VmStats | null;
  urls?: VmUrl[] | null;
  created_at: string;
  started_at?: string | null;
  updated_at?: string | null;

  /**
   * Who it belongs to, when the API says more than the uuid. The contract only
   * promises owner_uuid; a listing of everybody's shows this when it is there.
   */
  owner?: Partial<Author>;
};

export type Pagination = {
  total_pages: number;
  current_page: number;
};

/** Which VMs a listing is of. */
export type VmListParams = {
  page?: number | string;

  /** Only VMs of this kind: the Docker VMs are the ones containers run in. */
  kind?: VmKind;
};

/** One page of a listing. */
export type Page<T> = {
  items: T[];
  pagination: Pagination;
};

/**
 * A VM to create. With snapshot_uuid it is restored from that snapshot: the
 * kind and image are the snapshot's, and the disk is the larger of the one
 * asked for and the snapshot's.
 */
export type CreateVmRequest = {
  name: string;
  kind: VmKind;

  /** Left out for a Docker VM or a restore: the workload knows which. */
  image?: string;
  resources: VmResources;
  ports: number[];
  network: VmNetwork;
  persistent_disk: boolean;
  lifetime_seconds: number;
  snapshot_uuid?: string;
};

/**
 * What can be changed about a VM once it exists. Kind and image cannot; the
 * disk can only grow. Changing ports, network or resources restarts a VM that
 * is running.
 */
export type UpdateVmRequest = Partial<{
  name: string;
  ports: number[];
  network: VmNetwork;
  lifetime_seconds: number;
  resources: VmResources;
}>;

/** What can be asked of a VM, besides changing it. */
export type VmCommand = "start" | "stop" | "restart";

/** One line of what a VM has written, and where it came from. */
export type VmLogLine = {
  at: string;

  /** "kernel", "runtime", "main" or "exec". */
  source: string;
  line: string;
};

export type VmLogs = {
  items: VmLogLine[];

  /** Set when there was more than one answer may carry. */
  truncated?: boolean;
};

/** How an action the API may refuse turned out. */
export type ActionResult =
  | {ok: true}
  | {
      ok: false;

      /** What the API said was wrong with what was sent, field by field. */
      errors?: Record<string, string>;
    };
