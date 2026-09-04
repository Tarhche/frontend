"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {
  commandStack as command,
  commandMyStack,
  deleteStack as remove,
  deleteMyStack,
} from "@/dal/private/runner";

/** The commands a stack takes, each reaching every service in it. */
export type StackCommand = "stop" | "kill" | "restart";

async function ask(
  uuid: string,
  through: () => Promise<unknown>,
): Promise<boolean> {
  try {
    await through();
    revalidatePath(APP_PATHS.dashboard.stacks.index);
    revalidatePath(APP_PATHS.dashboard.stacks.detail(uuid));
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function commandStack(
  command_: StackCommand,
  uuid: string,
): Promise<boolean> {
  return ask(uuid, () => command(uuid, command_));
}

/**
 * The same, asked for as one's own: a stack somebody else owns is not there to
 * be commanded that way.
 */
export async function commandMyStackAction(
  command_: StackCommand,
  uuid: string,
): Promise<boolean> {
  return ask(uuid, () => commandMyStack(uuid, command_));
}

async function removeStack(
  formData: FormData,
  through: (uuid: string) => Promise<unknown>,
): Promise<boolean> {
  const uuid = formData.get("id")?.toString();
  if (uuid === undefined) {
    return false;
  }

  try {
    await through(uuid);
    revalidatePath(APP_PATHS.dashboard.stacks.index);
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
  return removeStack(formData, remove);
}

export async function deleteMyStackAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  return removeStack(formData, deleteMyStack);
}
