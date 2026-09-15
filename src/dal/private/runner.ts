import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchTasks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/runner/tasks", config);
  return response.data;
}

export async function fetchMyTasks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    "dashboard/my/runner/tasks",
    config,
  );
  return response.data;
}

export async function fetchTask(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/runner/tasks/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchMyTask(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/my/runner/tasks/${uuid}`,
    config,
  );
  return response.data;
}

export async function fetchTaskLogs(uuid: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/runner/tasks/${uuid}/logs`,
    config,
  );
  return response.data;
}

export async function fetchMyTaskLogs(
  uuid: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/my/runner/tasks/${uuid}/logs`,
    config,
  );
  return response.data;
}

export async function commandTask(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/runner/tasks/${uuid}/${command}`,
  );
}

export async function commandMyTask(uuid: string, command: string) {
  return await privateDalDriver.post(
    `dashboard/my/runner/tasks/${uuid}/${command}`,
  );
}

export async function deleteTask(uuid: string) {
  return await privateDalDriver.delete(`dashboard/runner/tasks/${uuid}`);
}

export async function deleteMyTask(uuid: string) {
  return await privateDalDriver.delete(`dashboard/my/runner/tasks/${uuid}`);
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
