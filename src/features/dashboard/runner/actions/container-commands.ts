"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {
  commandContainer as command,
  commandMyContainer,
  deleteContainer as remove,
  deleteMyContainer,
} from "@/dal/private/runner";

/**
 * The commands a container takes. A container is immutable, so this is the
 * whole of what can be asked of one after it is running.
 */
export type ContainerCommand = "stop" | "kill" | "restart";

async function ask(
  uuid: string,
  through: () => Promise<unknown>,
): Promise<boolean> {
  try {
    await through();
    revalidatePath(APP_PATHS.dashboard.containers.index);
    revalidatePath(APP_PATHS.dashboard.containers.detail(uuid));
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function commandContainer(
  command_: ContainerCommand,
  uuid: string,
): Promise<boolean> {
  return ask(uuid, () => command(uuid, command_));
}

/**
 * The same, asked for as one's own: a container somebody else owns is not
 * there to be commanded that way.
 */
export async function commandMyContainerAction(
  command_: ContainerCommand,
  uuid: string,
): Promise<boolean> {
  return ask(uuid, () => commandMyContainer(uuid, command_));
}

async function removeContainer(
  formData: FormData,
  through: (uuid: string) => Promise<unknown>,
): Promise<boolean> {
  const uuid = formData.get("id")?.toString();
  if (uuid === undefined) {
    return false;
  }

  try {
    await through(uuid);
    revalidatePath(APP_PATHS.dashboard.containers.index);
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
  return removeContainer(formData, remove);
}

export async function deleteMyContainerAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  return removeContainer(formData, deleteMyContainer);
}
