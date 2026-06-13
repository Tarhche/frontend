import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchAllArticles(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/articles", config);
  return response.data;
}

export async function createArticle(data: any) {
  return await privateDalDriver.post("dashboard/articles", data);
}

export async function updateArticle(data: any) {
  return await privateDalDriver.put("dashboard/articles", data);
}

export async function fetchArticle(
  correlationUuid: string,
  languageCode: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/articles/${correlationUuid}/${languageCode}`,
    config,
  );
  return response.data;
}
