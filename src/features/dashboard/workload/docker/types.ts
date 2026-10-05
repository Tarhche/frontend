/**
 * Whose things a request is about: anybody's, asked for through the admin
 * routes, or the caller's own, asked for through the "my" routes. The two are
 * served under different permissions, so which one a page uses is decided by
 * what the person reading it may do.
 */
export type Scope = "all" | "mine";

/**
 * Where a page lists the Docker VMs it offers: a scope's VM routes, narrowed
 * to one owner when the admin routes stand in for somebody's own.
 */
export type VmSource = {
  scope: Scope;
  owner?: string;
};

/*
 * The VM shapes below are the VM pages' own (vms/types.ts), written out again
 * here so that this feature stands on its own until the two are merged; the
 * names and fields are the same, so one can be swapped for the other.
 */

/**
 * What a VM is booted as: an OS image with nothing running in it but what is
 * started there, or the Docker image with dockerd running, which is what
 * containers and stacks are run in.
 */
export type VmKind = "machine" | "docker";

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

  /**
   * Guest ports exposed through the ingress, sorted and unique. A container
   * port published on any other port of the VM is reachable only inside it.
   */
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
 * What is in a Docker VM, listed whole: dockerd is asked each time, so there
 * are no pages of it.
 */
export type Listing<T> = {
  items: T[];
};

export type Protocol = "tcp" | "udp";

export type PortBinding = {
  container_port: number;
  host_port: number;
  protocol: Protocol;
};

export type MountType = "volume" | "bind" | "tmpfs";

export type Mount = {
  type: MountType;
  source: string;
  target: string;
  read_only: boolean;
};

export type RestartPolicy = "no" | "always" | "unless-stopped" | "on-failure";

/**
 * A container, as dockerd in its VM reports it. Containers are never stored by
 * the platform: every one of these was read live.
 */
export type Container = {
  id: string;
  name: string;
  image: string;

  /** created | running | paused | restarting | removing | exited | dead */
  state: string;

  /** what docker says about it in words, such as "Up 3 minutes". */
  status: string;
  command?: string;
  ports?: PortBinding[];
  networks?: string[];
  mounts?: Mount[];
  labels?: Record<string, string>;

  /** the compose project and service it belongs to, when it was deployed by a
   * stack. The project is the stack's slug. */
  stack?: string;
  service?: string;
  restart_policy?: string;
  created_at?: string;

  /** set on the listing across VMs, which says where each one was found. */
  vm_uuid?: string;
  vm_name?: string;
};

export type Image = {
  id: string;
  tags?: string[];
  size: number;
  created_at?: string;
  in_use?: boolean;
};

export type Network = {
  id: string;
  name: string;
  driver: string;
  scope?: string;
  internal?: boolean;
  containers?: string[];
  labels?: Record<string, string>;
  created_at?: string;
};

export type Volume = {
  name: string;
  driver?: string;
  mountpoint?: string;
  labels?: Record<string, string>;
  in_use?: boolean;
  created_at?: string;
};

/** One sample of a container's usage. Network and block IO are counters. */
export type ContainerStats = {
  cpu_percent: number;
  memory_used: number;
  memory_limit: number;
  network_rx: number;
  network_tx: number;
  block_read: number;
  block_write: number;
  pids: number;
  sampled_at: string;
};

export type LogLine = {
  at: string;
  stream: string;
  line: string;
};

export type LogsResponse = {
  items: LogLine[];
  truncated?: boolean;
};

/** A Docker VM to create along with what is asked for, when there is none to
 * put it in. Anything left out takes the platform's Docker defaults. */
export type NewVmRequest = {
  name?: string;
  resources?: Partial<VmResources>;
  ports?: number[];
  network?: VmNetwork;
};

/** Where a container or a stack goes: a VM by its uuid, a new one, or neither,
 * which leaves the choice to the platform. */
export type VmTarget = {
  vm_uuid?: string;
  vm?: NewVmRequest;
};

export type ContainerCreateRequest = VmTarget & {
  name?: string;
  image: string;
  command?: string[];
  entrypoint?: string[];
  env?: string[];
  working_dir?: string;
  ports?: PortBinding[];
  mounts?: Mount[];
  networks?: string[];
  restart_policy?: RestartPolicy;
  cpus?: number;
  memory?: number;
};

/** Which VM a create went to, and whether it was made for it. */
export type ChosenVm = {
  uuid: string;
  name: string;
  created: boolean;
};

export type ContainerCreateResponse = {
  vm: ChosenVm;
  container: Container;
};

export type ContainerCommand = "start" | "stop" | "restart";

export type NetworkCreateRequest = {
  name: string;
  driver: "bridge";
  internal: boolean;
};

export type VolumeCreateRequest = {
  name: string;
};
