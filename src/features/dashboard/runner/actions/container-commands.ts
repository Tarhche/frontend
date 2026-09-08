"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {privateDalDriver} from "@/dal/private/private-dal-driver";

/**
 * The commands a container takes. A container is immutable, so this is the
 * whole of what can be asked of one after it is running.
 */
export type ContainerCommand = "stop" | "kill" | "restart";

export async function commandContainer(
  command: ContainerCommand,
  uuid: string,
): Promise<boolean> {
  try {
    await privateDalDriver.post(
      `/dashboard/runner/containers/${uuid}/${command}`,
    );
    revalidatePath(APP_PATHS.dashboard.containers.index);
    revalidatePath(APP_PATHS.dashboard.containers.detail(uuid));
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function deleteContainer(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const uuid = formData.get("id")?.toString();
  if (uuid === undefined) {
    return false;
  }

  try {
    await privateDalDriver.delete(`/dashboard/runner/containers/${uuid}`);
    revalidatePath(APP_PATHS.dashboard.containers.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
