"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {deleteLanguage} from "@/dal/private/languages";
import {APP_PATHS} from "@/lib/app-paths";

export async function deleteLanguageAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const code = formData.get("code")?.toString();
  if (code === undefined) {
    return false;
  }

  try {
    await deleteLanguage(code);
    revalidatePath(APP_PATHS.dashboard.languages.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
