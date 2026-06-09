import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchLanguages(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/languages", config);

  return response.data;
}

export async function fetchLanguage(code: string, config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get(
    `dashboard/languages/${encodeURIComponent(code)}`,
    config,
  );

  return response.data;
}

export async function createLanguage(data: any) {
  return await privateDalDriver.post("dashboard/languages", data);
}

export async function updateLanguage(data: any) {
  return await privateDalDriver.put("dashboard/languages", data);
}

export async function deleteLanguage(code: string) {
  return await privateDalDriver.delete(
    `dashboard/languages/${encodeURIComponent(code)}`,
  );
}
