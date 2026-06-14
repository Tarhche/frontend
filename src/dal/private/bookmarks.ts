import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchUserBookmarks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/my/bookmarks", config);
  return response.data;
}

export async function removeUserBookmark(
  correlationUUID: string,
  languageCode: string,
) {
  const response = await privateDalDriver.delete("dashboard/my/bookmarks", {
    data: {
      object_type: "article",
      object_uuid: correlationUUID,
      language_code: languageCode,
    },
  });
  return response.data;
}

export async function checkBookmarkStatus(
  correlationUUID?: string,
  languageCode?: string,
): Promise<boolean | undefined> {
  if (correlationUUID === undefined || languageCode === undefined) {
    return undefined;
  }
  try {
    const response = await privateDalDriver.post("bookmarks/exists", {
      object_type: "article",
      object_uuid: correlationUUID,
      language_code: languageCode,
    });

    return response.data?.exist;
  } catch {
    return undefined;
  }
}

export async function bookmarkArticle(body: {
  keep: boolean;
  correlationUUID: string;
  title: string;
  language_code: string;
}) {
  const response = await privateDalDriver.put("bookmarks", {
    keep: body.keep,
    title: body.title,
    object_type: "article",
    object_uuid: body.correlationUUID,
    language_code: body.language_code,
  });
  return response.data;
}
