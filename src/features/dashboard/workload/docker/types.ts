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

export type Access = "allow" | "deny";

/** CPUs are whole vCPUs; memory and disk are bytes, end to end. */
export type VmResources = {
  cpus: number;
  memory: number;
  disk: number;
};

/** How much of the network a VM has. Nothing lets one VM reach another. */
export type VmNetwork = {
  ingress: Access;
  egress: Access;
};

/**
 * A VM as the dashboard API returns one. Only what the Docker pages read is
 * typed here; the VM pages own the rest of it.
 */
export type Vm = {
  uuid: string;
  name: string;
  slug?: string;
  owner_uuid?: string;
  kind: "machine" | "docker";
  image?: string;
  resources?: VmResources;

  /** the guest ports the ingress serves; a container port published on any
   * other VM port is reachable only from inside the VM. */
  ports?: number[];
  network?: VmNetwork;
  state: string;
  expected_state?: string;
  reason?: string;
  urls?: {port: number; url: string}[];
  created_at?: string;
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

/** A page of a listing, the way every dashboard listing is answered. */
export type Page<T> = {
  items: T[];
  pagination?: {
    total_pages: number;
    current_page: number;
  };
};
