import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {
  type Scope,
  vmPath,
  workloadPath,
} from "@/features/dashboard/workload/vms/api";
import {
  type Container,
  type ContainerCommand,
  type ContainerCreateRequest,
  type ContainerCreateResponse,
  type ContainerStats,
  type Image,
  type Listing,
  type LogsResponse,
  type Network,
  type NetworkCreateRequest,
  type Volume,
  type VolumeCreateRequest,
} from "./types";

/*
 * What the browser asks of the Docker VMs: their containers, images, networks
 * and volumes, read live from each VM's dockerd. The paths are the VM pages'
 * (vms/api.ts), and so are the VMs themselves (vms/client.ts).
 */

/**
 * Where containers are created. It is the workload's own route whoever asks,
 * and it always creates for the caller, in one of the caller's Docker VMs.
 */
export function createContainerPath(): string {
  return workloadPath("all", "containers");
}

// a docker id or name goes into a path as one segment, whatever it holds: an
// image id carries a colon, and a network name may carry anything docker allows.
const segment = encodeURIComponent;

function containerPath(scope: Scope, vmUuid: string, id: string): string {
  return `${vmPath(scope, vmUuid)}/containers/${segment(id)}`;
}

/** What a listing holds, whether it was answered as one or as the bare list. */
export function itemsOf<T>(data: Listing<T> | T[] | null | undefined): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.items ?? [];
}

/**
 * The containers across every running Docker VM in a scope, each saying which
 * VM it was found in. Naming a VM narrows it to that one.
 */
export async function fetchContainers(
  scope: Scope,
  vm?: string,
): Promise<Container[]> {
  const {data} = await clientDalDriver.get<Listing<Container> | Container[]>(
    workloadPath(scope, "containers"),
    {params: vm ? {vm} : undefined},
  );

  return itemsOf(data);
}

export async function fetchContainer(
  scope: Scope,
  vmUuid: string,
  id: string,
): Promise<Container> {
  const {data} = await clientDalDriver.get<Container>(
    containerPath(scope, vmUuid, id),
  );

  return data;
}

/**
 * Creates and starts a container, pulling its image first when the VM does not
 * have it. That can take minutes, so nothing here gives up on the answer: the
 * server has its own limit, and says so when it is reached.
 */
export async function createContainer(
  body: ContainerCreateRequest,
): Promise<ContainerCreateResponse> {
  const {data} = await clientDalDriver.post<ContainerCreateResponse>(
    createContainerPath(),
    body,
  );

  return data;
}

export async function commandContainer(
  scope: Scope,
  vmUuid: string,
  id: string,
  command: ContainerCommand,
): Promise<void> {
  await clientDalDriver.post(`${containerPath(scope, vmUuid, id)}/${command}`);
}

/** Removes a container. A running one is only removed by force. */
export async function removeContainer(
  scope: Scope,
  vmUuid: string,
  id: string,
  force: boolean,
): Promise<void> {
  await clientDalDriver.delete(containerPath(scope, vmUuid, id), {
    params: force ? {force: true} : undefined,
  });
}

/**
 * A container's output: the last `tail` lines, or those written since a moment,
 * which is how a log that is being followed asks only for what is new.
 */
export async function fetchContainerLogs(
  scope: Scope,
  vmUuid: string,
  id: string,
  params: {since?: string; tail?: number},
): Promise<LogsResponse> {
  const {data} = await clientDalDriver.get<
    LogsResponse | LogsResponse["items"]
  >(`${containerPath(scope, vmUuid, id)}/logs`, {params});

  if (Array.isArray(data)) {
    return {items: data};
  }

  return {items: data?.items ?? [], truncated: data?.truncated};
}

export async function fetchContainerStats(
  scope: Scope,
  vmUuid: string,
  id: string,
): Promise<ContainerStats> {
  const {data} = await clientDalDriver.get<ContainerStats>(
    `${containerPath(scope, vmUuid, id)}/stats`,
  );

  return data;
}

/** Attaches a container to another network of its VM, under these aliases. */
export async function connectContainerNetwork(
  scope: Scope,
  vmUuid: string,
  id: string,
  network: string,
  aliases: string[],
): Promise<void> {
  await clientDalDriver.post(`${containerPath(scope, vmUuid, id)}/networks`, {
    network,
    aliases,
  });
}

export async function disconnectContainerNetwork(
  scope: Scope,
  vmUuid: string,
  id: string,
  network: string,
): Promise<void> {
  await clientDalDriver.delete(
    `${containerPath(scope, vmUuid, id)}/networks/${segment(network)}`,
  );
}

export async function fetchImages(
  scope: Scope,
  vmUuid: string,
): Promise<Image[]> {
  const {data} = await clientDalDriver.get<Listing<Image> | Image[]>(
    `${vmPath(scope, vmUuid)}/images`,
  );

  return itemsOf(data);
}

/** Pulls an image into a VM, which takes as long as the registry does. */
export async function pullImage(
  scope: Scope,
  vmUuid: string,
  reference: string,
): Promise<Image> {
  const {data} = await clientDalDriver.post<Image>(
    `${vmPath(scope, vmUuid)}/images`,
    {reference},
  );

  return data;
}

export async function removeImage(
  scope: Scope,
  vmUuid: string,
  id: string,
  force: boolean,
): Promise<void> {
  await clientDalDriver.delete(
    `${vmPath(scope, vmUuid)}/images/${segment(id)}`,
    {
      params: force ? {force: true} : undefined,
    },
  );
}

export async function fetchNetworks(
  scope: Scope,
  vmUuid: string,
): Promise<Network[]> {
  const {data} = await clientDalDriver.get<Listing<Network> | Network[]>(
    `${vmPath(scope, vmUuid)}/networks`,
  );

  return itemsOf(data);
}

export async function createNetwork(
  scope: Scope,
  vmUuid: string,
  body: NetworkCreateRequest,
): Promise<Network> {
  const {data} = await clientDalDriver.post<Network>(
    `${vmPath(scope, vmUuid)}/networks`,
    body,
  );

  return data;
}

export async function removeNetwork(
  scope: Scope,
  vmUuid: string,
  id: string,
): Promise<void> {
  await clientDalDriver.delete(
    `${vmPath(scope, vmUuid)}/networks/${segment(id)}`,
  );
}

export async function fetchVolumes(
  scope: Scope,
  vmUuid: string,
): Promise<Volume[]> {
  const {data} = await clientDalDriver.get<Listing<Volume> | Volume[]>(
    `${vmPath(scope, vmUuid)}/volumes`,
  );

  return itemsOf(data);
}

export async function createVolume(
  scope: Scope,
  vmUuid: string,
  body: VolumeCreateRequest,
): Promise<Volume> {
  const {data} = await clientDalDriver.post<Volume>(
    `${vmPath(scope, vmUuid)}/volumes`,
    body,
  );

  return data;
}

/** Removes a volume. One a container still uses is only removed by force. */
export async function removeVolume(
  scope: Scope,
  vmUuid: string,
  name: string,
  force: boolean,
): Promise<void> {
  await clientDalDriver.delete(
    `${vmPath(scope, vmUuid)}/volumes/${segment(name)}`,
    {params: force ? {force: true} : undefined},
  );
}
