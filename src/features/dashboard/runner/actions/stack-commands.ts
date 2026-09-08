"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {privateDalDriver} from "@/dal/private/private-dal-driver";

/** The commands a stack takes, each reaching every service in it. */
export type StackCommand = "stop" | "kill" | "restart";

export async function commandStack(
  command: StackCommand,
  uuid: string,
): Promise<boolean> {
  try {
    await privateDalDriver.post(`/dashboard/runner/stacks/${uuid}/${command}`);
    revalidatePath(APP_PATHS.dashboard.stacks.index);
    revalidatePath(APP_PATHS.dashboard.stacks.detail(uuid));
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function deleteStack(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const uuid = formData.get("id")?.toString();
  if (uuid === undefined) {
    return false;
  }

  try {
    await privateDalDriver.delete(`/dashboard/runner/stacks/${uuid}`);
    revalidatePath(APP_PATHS.dashboard.stacks.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
