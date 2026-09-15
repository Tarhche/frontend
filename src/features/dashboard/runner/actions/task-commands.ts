"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {
  commandTask as command,
  commandMyTask,
  deleteTask as remove,
  deleteMyTask,
} from "@/dal/private/runner";

/**
 * The commands a task takes. A task is immutable, so this is the whole of what
 * can be asked of one after it is running.
 */
export type TaskCommand = "stop" | "kill" | "restart";

async function ask(
  uuid: string,
  through: () => Promise<unknown>,
): Promise<boolean> {
  try {
    await through();
    revalidatePath(APP_PATHS.dashboard.tasks.index);
    revalidatePath(APP_PATHS.dashboard.tasks.detail(uuid));
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function commandTask(
  command_: TaskCommand,
  uuid: string,
): Promise<boolean> {
  return ask(uuid, () => command(uuid, command_));
}

/**
 * The same, asked for as one's own: a task somebody else owns is not there to
 * be commanded that way.
 */
export async function commandMyTaskAction(
  command_: TaskCommand,
  uuid: string,
): Promise<boolean> {
  return ask(uuid, () => commandMyTask(uuid, command_));
}

async function removeTask(
  formData: FormData,
  through: (uuid: string) => Promise<unknown>,
): Promise<boolean> {
  const uuid = formData.get("id")?.toString();
  if (uuid === undefined) {
    return false;
  }

  try {
    await through(uuid);
    revalidatePath(APP_PATHS.dashboard.tasks.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function deleteTask(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  return removeTask(formData, remove);
}

export async function deleteMyTaskAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  return removeTask(formData, deleteMyTask);
}
