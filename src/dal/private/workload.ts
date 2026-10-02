import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchTasks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/workload/tasks",
    config,
  );
  return response.data;
}

export async function fetchMyTasks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/my/workload/tasks",
    config,
  );
  return response.data;
}

export async function fetchTask(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/workload/tasks/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchMyTask(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/my/workload/tasks/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchTaskLogs(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/workload/tasks/${uuid}/logs`,
    config,
  );
  return response.data;
}

export async function fetchMyTaskLogs(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/my/workload/tasks/${uuid}/logs`,
    config,
  );
  return response.data;
}

export async function commandTask(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/workload/tasks/${uuid}/${command}`,
  );
}

export async function commandMyTask(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/my/workload/tasks/${uuid}/${command}`,
  );
}

export async function deleteTask(uuid: string) {
  return await privateDalDriver.delete(`dashboard/workload/tasks/${uuid}`);
}

export async function deleteMyTask(uuid: string) {
  return await privateDalDriver.delete(`dashboard/my/workload/tasks/${uuid}`);
}

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

export async function fetchRuntimes(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/workload/runtimes",
    config,
  );
  return response.data;
}

export async function fetchMyRuntimes(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/my/workload/runtimes",
    config,
  );
  return response.data;
}
