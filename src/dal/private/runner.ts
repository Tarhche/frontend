import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchContainers(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/runner/containers",
    config,
  );
  return response.data;
}

export async function fetchMyContainers(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/my/runner/containers",
    config,
  );
  return response.data;
}

export async function fetchContainer(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/runner/containers/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchMyContainer(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/my/runner/containers/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchContainerLogs(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/runner/containers/${uuid}/logs`,
    config,
  );
  return response.data;
}

export async function fetchMyContainerLogs(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/my/runner/containers/${uuid}/logs`,
    config,
  );
  return response.data;
}

export async function commandContainer(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/runner/containers/${uuid}/${command}`,
  );
}

export async function commandMyContainer(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/my/runner/containers/${uuid}/${command}`,
  );
}

export async function deleteContainer(uuid: string) {
  return await privateDalDriver.delete(`dashboard/runner/containers/${uuid}`);
}

export async function deleteMyContainer(uuid: string) {
  return await privateDalDriver.delete(
    `dashboard/my/runner/containers/${uuid}`,
  );
}

export async function fetchStacks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/runner/stacks",
    config,
  );
  return response.data;
}

export async function fetchMyStacks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/my/runner/stacks",
    config,
  );
  return response.data;
}

export async function fetchStack(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/runner/stacks/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchMyStack(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/my/runner/stacks/${uuid}`,
    config,
  );
  return response.data;
}

export async function commandStack(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/runner/stacks/${uuid}/${command}`,
  );
}

export async function commandMyStack(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/my/runner/stacks/${uuid}/${command}`,
  );
}

export async function deleteStack(uuid: string) {
  return await privateDalDriver.delete(`dashboard/runner/stacks/${uuid}`);
}

export async function deleteMyStack(uuid: string) {
  return await privateDalDriver.delete(`dashboard/my/runner/stacks/${uuid}`);
}
