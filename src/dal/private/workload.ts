import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchStacks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/workload/stacks",
    config,
  );
  return response.data;
}

export async function fetchMyStacks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/my/workload/stacks",
    config,
  );
  return response.data;
}

export async function fetchStack(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/workload/stacks/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchMyStack(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/my/workload/stacks/${uuid}`,
    config,
  );
  return response.data;
}

export async function commandStack(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/workload/stacks/${uuid}/${command}`,
  );
}

export async function commandMyStack(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/my/workload/stacks/${uuid}/${command}`,
  );
}

export async function deleteStack(uuid: string) {
  return await privateDalDriver.delete(`dashboard/workload/stacks/${uuid}`);
}

export async function deleteMyStack(uuid: string) {
  return await privateDalDriver.delete(`dashboard/my/workload/stacks/${uuid}`);
}
