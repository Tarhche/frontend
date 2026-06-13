"use server";

import {revalidatePath} from "next/cache";
import {APP_PATHS} from "@/lib/app-paths";
import {privateDalDriver} from "@/dal/private/private-dal-driver";

export async function deleteArticle(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const correlationUuid = formData.get("correlation_uuid")?.toString();
  const languageCode = formData.get("language_code")?.toString();
  if (!correlationUuid || !languageCode) {
    return false;
  }

  try {
    await privateDalDriver.delete(
      `/dashboard/articles/${correlationUuid}/${languageCode}`,
    );
    revalidatePath(APP_PATHS.dashboard.articles.index);
    return true;
  } catch {
    return false;
  }
}
