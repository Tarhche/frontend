"use server";

import {revalidatePath} from "next/cache";
import {APP_PATHS} from "@/lib/app-paths";
import {removeUserBookmark} from "@/dal/private/bookmarks";

export async function removeBookmarkAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const fileId = formData.get("id")?.toString();
  if (fileId === undefined) {
    return false;
  }
  try {
    await removeUserBookmark(fileId);
    revalidatePath(APP_PATHS.dashboard.files);
    return true;
  } catch {
    return false;
  }
}
