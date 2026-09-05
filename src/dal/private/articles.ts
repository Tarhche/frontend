import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchAllArticles(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/articles", config);
  return response.data;
}

export async function fetchMyArticles(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/my/articles", config);
  return response.data;
}

export async function createArticle(data: any) {
  return await privateDalDriver.post("dashboard/articles", data);
}

export async function updateArticle(data: any) {
  return await privateDalDriver.put("dashboard/articles", data);
}

export async function updateMyArticle(data: any) {
  return await privateDalDriver.put("dashboard/my/articles", data);
}

export async function deleteArticle(
  correlationUuid: string,
  languageCode: string,
) {
  return await privateDalDriver.delete(
    `dashboard/articles/${correlationUuid}/${languageCode}`,
  );
}

export async function deleteMyArticle(
  correlationUuid: string,
  languageCode: string,
) {
  return await privateDalDriver.delete(
    `dashboard/my/articles/${correlationUuid}/${languageCode}`,
  );
}

// Returns the article translation, or `null` when it doesn't exist yet (404).
// We tolerate the 404 here — instead of letting `ServerPublicInterceptor` send
// the caller to the not-found page — so the dashboard can offer to create the
// missing translation under the same correlation group.
export async function fetchArticleTranslation(
  correlationUuid: string,
  languageCode: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/articles/${correlationUuid}/${languageCode}`,
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

// The same, of one's own articles: an article somebody else wrote is not found
// here either, so a person who may only reach their own is told the same thing
// about it as about a translation that does not exist yet.
export async function fetchMyArticleTranslation(
  correlationUuid: string,
  languageCode: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `dashboard/my/articles/${correlationUuid}/${languageCode}`,
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
