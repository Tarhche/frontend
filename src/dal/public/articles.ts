import {cache} from "react";
import {AxiosRequestConfig} from "axios";
import {publicDalDriver} from "./public-dal-driver";

export async function fetchArticles(config?: AxiosRequestConfig) {
  const response = await publicDalDriver.get("articles", config);
  return response.data;
}

// Cached per-request so the page and its metadata share a single fetch. Returns
// null when the article has no translation for the requested language (404)
// instead of throwing notFound(), so the page can render the not-found UI as
// plain content — reliable even mid-stream behind the route's loading skeleton.
export const fetchArticleByUUID = cache(
  async (uuid: string, languageCode?: string) => {
    const response = await publicDalDriver.get(`articles/${uuid}`, {
      params: languageCode ? {language_code: languageCode} : undefined,
      validateStatus: (status) => status < 500,
    });
    if (response.status === 404) {
      return null;
    }
    return response.data;
  },
);
