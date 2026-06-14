"use server";

import {revalidatePath} from "next/cache";
import {APP_PATHS} from "@/lib/app-paths";
import {removeUserBookmark} from "@/dal/private/bookmarks";

export async function removeBookmarkAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const correlationUUID = formData.get("id")?.toString();
  const languageCode = formData.get("language-code")?.toString();
  if (correlationUUID === undefined || languageCode === undefined) {
    return false;
  }
  try {
    await removeUserBookmark(correlationUUID, languageCode);
    revalidatePath(APP_PATHS.dashboard.files);
    return true;
  } catch {
    return false;
  }
}
