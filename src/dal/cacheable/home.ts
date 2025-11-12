import {AxiosRequestConfig} from "axios";
import {cacheableDalDriver} from "./cacheable-dal-driver";

export async function fetchHomePageData(config?: AxiosRequestConfig) {
  const response = await cacheableDalDriver.get("home", config);

  return response.data;
}
