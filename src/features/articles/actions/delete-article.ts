"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {deleteArticle as remove, deleteMyArticle} from "@/dal/private/articles";

async function removeArticle(
  formData: FormData,
  through: (correlationUuid: string, languageCode: string) => Promise<unknown>,
): Promise<boolean> {
  const correlationUuid = formData.get("correlation_uuid")?.toString();
  const languageCode = formData.get("language_code")?.toString();
  if (!correlationUuid || !languageCode) {
    return false;
  }

  try {
    await through(correlationUuid, languageCode);
    revalidatePath(APP_PATHS.dashboard.articles.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function deleteArticle(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  return removeArticle(formData, remove);
}

/**
 * The same, asked for as one's own: an article somebody else wrote is not there
 * to delete, which is what somebody trusted with only their own is told.
 */
export async function deleteMyArticleAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  return removeArticle(formData, deleteMyArticle);
}
