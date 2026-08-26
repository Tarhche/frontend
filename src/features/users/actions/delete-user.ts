"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {deleteUser} from "@/dal/private/users";

export async function deleteUserAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const userID = formData.get("id")?.toString();
  if (userID === undefined) {
    return false;
  }
  try {
    await deleteUser(userID);
    revalidatePath(APP_PATHS.dashboard.users.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
