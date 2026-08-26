"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {deleteContactMessage} from "@/dal/private/contact";

export async function deleteContactMessageAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const uuid = formData.get("id")?.toString();
  if (uuid === undefined) {
    return false;
  }
  try {
    await deleteContactMessage(uuid);
    revalidatePath(APP_PATHS.dashboard.contactUs.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
