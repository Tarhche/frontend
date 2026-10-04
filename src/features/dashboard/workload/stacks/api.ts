import {clientDalDriver} from "@/dal/client/client-dal-driver";
import {
  CREATE_BASE,
  workloadBase,
} from "@/features/dashboard/workload/docker/api";
import {
  type Page,
  type Scope,
} from "@/features/dashboard/workload/docker/types";
import {
  type Stack,
  type StackCommand,
  type StackCreateRequest,
  type StackCreateResponse,
  type StackDetail,
} from "./types";

function stackPath(scope: Scope, uuid: string): string {
  return `${workloadBase(scope)}/stacks/${encodeURIComponent(uuid)}`;
}

/** A page of a scope's stacks, of one VM's when a VM is named. */
export async function fetchStacks(
  scope: Scope,
  options: {page?: number | string; vm?: string} = {},
): Promise<Page<Stack>> {
  const {data} = await clientDalDriver.get<Page<Stack> | Stack[]>(
    `${workloadBase(scope)}/stacks`,
    {params: {page: options.page, vm: options.vm}},
  );

  if (Array.isArray(data)) {
    return {items: data};
  }

  return {items: data?.items ?? [], pagination: data?.pagination};
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
 * Deploys a compose file into a Docker VM. The deploy itself happens after
 * the answer, so what comes back is a stack that is still deploying.
 */
export async function createStack(
  body: StackCreateRequest,
): Promise<StackCreateResponse> {
  const {data} = await clientDalDriver.post<StackCreateResponse>(
    `${CREATE_BASE}/stacks`,
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
 * Takes a stack down and forgets it. Its volumes stay unless asked to go with
 * it, since what is in them is usually what somebody would want back.
 */
export async function deleteStack(
  scope: Scope,
  uuid: string,
  removeVolumes: boolean,
): Promise<void> {
  await clientDalDriver.delete(stackPath(scope, uuid), {
    params: removeVolumes ? {volumes: true} : undefined,
  });
}
