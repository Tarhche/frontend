import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchAllElements(config?: AxiosRequestConfig) {
    const response = await privateDalDriver.get("dashboard/elements", config);
  return response.data;
}

export async function createElement(data: any) {
  return await privateDalDriver.post("dashboard/elements", data);
}

export async function updateElement(data: any) {
  return await privateDalDriver.put("dashboard/elements", data);
}

export async function fetchElement(
  articleId: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/elements/${articleId}`,
    config,
  );
  return response.data;
}
