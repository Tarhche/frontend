import {AxiosRequestConfig} from "axios";
import {publicDalDriver} from "./public-dal-driver";

export async function fetchAuthorArticles(
  identity: string,
  config?: AxiosRequestConfig,
) {
  const response = await publicDalDriver.get(
    `authors/${encodeURIComponent(identity)}/articles`,
    config,
  );
  return response.data;
}
