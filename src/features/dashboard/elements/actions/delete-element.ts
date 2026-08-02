"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {privateDalDriver} from "@/dal/private/private-dal-driver";

export async function deleteElement(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const id = formData.get("id")?.toString();
  if (id === undefined) {
    return false;
  }

  try {
    await privateDalDriver.delete(`/dashboard/elements/${id}`);
    revalidatePath(APP_PATHS.dashboard.elements.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
