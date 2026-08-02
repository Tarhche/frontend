"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {removeUserBookmark} from "@/dal/private/bookmarks";
import {type BookmarkObjectType} from "../types";

export async function removeBookmarkAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const correlationUUID = formData.get("id")?.toString();
  const languageCode = formData.get("language-code")?.toString();
  const objectType = formData.get("object-type")?.toString();
  if (
    correlationUUID === undefined ||
    languageCode === undefined ||
    objectType === undefined
  ) {
    return false;
  }
  try {
    await removeUserBookmark(
      objectType as BookmarkObjectType,
      correlationUUID,
      languageCode,
    );
    revalidatePath(APP_PATHS.dashboard.my.bookmarks);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
