import {AxiosRequestConfig} from "axios";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {type BookmarkObjectType} from "@/features/bookmarks/types";
import {privateDalDriver} from "./private-dal-driver";

export async function fetchUserBookmarks(config?: AxiosRequestConfig) {
  const response = await privateDalDriver.get("dashboard/my/bookmarks", config);
  return response.data;
}

export async function removeUserBookmark(
  objectType: BookmarkObjectType,
  correlationUUID: string,
  languageCode: string,
) {
  const response = await privateDalDriver.delete("dashboard/my/bookmarks", {
    data: {
      object_type: objectType,
      object_uuid: correlationUUID,
      language_code: languageCode,
    },
    headers: {[LANGUAGE_CODE_HEADER]: languageCode},
  });
  return response.data;
}

export async function checkBookmarkStatus(
  objectType: BookmarkObjectType,
  correlationUUID?: string,
  languageCode?: string,
): Promise<boolean | undefined> {
  if (correlationUUID === undefined || languageCode === undefined) {
    return undefined;
  }
  try {
    const response = await privateDalDriver.post(
      "bookmarks/exists",
      {
        object_type: objectType,
        object_uuid: correlationUUID,
        language_code: languageCode,
      },
      {headers: {[LANGUAGE_CODE_HEADER]: languageCode}},
    );

    return response.data?.exist;
  } catch {
    return undefined;
  }
}

export async function saveBookmark(body: {
  keep: boolean;
  objectType: BookmarkObjectType;
  correlationUUID: string;
  // What the dashboard bookmark list shows. Notes have no title of their own,
  // so their opening line stands in for one.
  title: string;
  language_code: string;
}) {
  const response = await privateDalDriver.put(
    "bookmarks",
    {
      keep: body.keep,
      title: body.title,
      object_type: body.objectType,
      object_uuid: body.correlationUUID,
      language_code: body.language_code,
    },
    {headers: {[LANGUAGE_CODE_HEADER]: body.language_code}},
  );
  return response.data;
}
