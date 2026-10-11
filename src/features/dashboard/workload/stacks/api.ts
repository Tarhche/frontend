import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {type Scope, workloadPath} from "@/features/dashboard/workload/vms/api";
import {type Page} from "@/features/dashboard/workload/vms/types";
import {
  type Stack,
  type StackCommand,
  type StackCreateRequest,
  type StackCreateResponse,
  type StackDetail,
} from "./types";

export function stacksPath(scope: Scope): string {
  return workloadPath(scope, "stacks");
}

export function stackPath(scope: Scope, uuid: string): string {
  return `${stacksPath(scope)}/${encodeURIComponent(uuid)}`;
}

/**
 * Where stacks are created. It is the workload's own route whoever asks, and
 * it always deploys for the caller, into one of the caller's Docker VMs.
 */
export function createStackPath(): string {
  return stacksPath("all");
}

// a listing that came without its pages is all there is of it.
const ONE_PAGE = {total_pages: 1, current_page: 1};

/** A page of a scope's stacks, of one VM's when a VM is named. */
export async function fetchStacks(
  scope: Scope,
  options: {page?: number | string; vm?: string} = {},
): Promise<Page<Stack>> {
  const {data} = await clientDalDriver.get<Page<Stack> | Stack[]>(
    stacksPath(scope),
    {params: {page: options.page, vm: options.vm}},
  );

  if (Array.isArray(data)) {
    return {items: data, pagination: ONE_PAGE};
  }

  return {items: data?.items ?? [], pagination: data?.pagination ?? ONE_PAGE};
}

/** A stack, with its containers as its VM lists them now. */
export async function fetchStack(
  scope: Scope,
  uuid: string,
): Promise<StackDetail> {
  const {data} = await clientDalDriver.get<StackDetail>(stackPath(scope, uuid));

  return data;
}

/**
 * Deploys a stack into a Docker VM from its file, which the platform reads
 * and refuses, by where in it each thing wrong is, before anything is made.
 * What it says is made after the answer, so what comes back is a stack that
 * is still deploying.
 */
export async function createStack(
  body: StackCreateRequest,
): Promise<StackCreateResponse> {
  const {data} = await clientDalDriver.post<StackCreateResponse>(
    createStackPath(),
    body,
  );

  return data;
}

export async function commandStack(
  scope: Scope,
  uuid: string,
  command: StackCommand,
): Promise<void> {
  await clientDalDriver.post(`${stackPath(scope, uuid)}/${command}`);
}

/**
 * Takes a stack down and forgets it: its containers and networks go, and its
 * volumes and its VM stay. There is no asking for the volumes to go with it:
 * what is in them is usually what somebody would want back, so they are
 * removed on their own, from the Volumes page.
 */
export async function deleteStack(scope: Scope, uuid: string): Promise<void> {
  await clientDalDriver.delete(stackPath(scope, uuid));
}
