import {AxiosRequestConfig} from "axios";
import {publicDalDriver} from "./public-dal-driver";

export async function fetchArticles(config?: AxiosRequestConfig) {
  const response = await publicDalDriver.get("articles", config);
  return response.data;
}
