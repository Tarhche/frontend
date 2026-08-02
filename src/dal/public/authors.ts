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

// Returns null when the backend answers 404 for the author's notes, so the
// caller can fall back to what it can show instead of erroring out.
export async function fetchAuthorNotes(
  identity: string,
  config?: AxiosRequestConfig,
) {
  const response = await publicDalDriver.get(
    `authors/${encodeURIComponent(identity)}/notes`,
    {
      ...config,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    },
  );
  if (response.status === 404) {
    return null;
  }
  return response.data;
}
