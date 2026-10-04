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
