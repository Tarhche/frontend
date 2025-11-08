"use server";
import {revalidatePath} from "next/cache";
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
  } catch {
    return false;
  }
}
