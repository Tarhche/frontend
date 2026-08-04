"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {markContactMessageAsRead} from "@/dal/private/contact";

// Takes the state to move to, rather than flipping whatever the client last saw:
// a toggle computed against a stale value would write the wrong one. The read
// timestamp itself is the backend's to stamp.
export async function markContactMessageAsReadAction(
  uuid: string,
  read: boolean,
): Promise<boolean> {
  try {
    await markContactMessageAsRead(uuid, read);
    revalidatePath(APP_PATHS.dashboard.contactUs.index);
    revalidatePath(APP_PATHS.dashboard.contactUs.detail(uuid));
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
