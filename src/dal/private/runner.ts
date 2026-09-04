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
