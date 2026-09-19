"use server";

import {revalidatePath} from "next/cache";
import {
  activeSessionId,
  clearActiveSession,
  forgetAccount,
  forgetAllAccounts,
  readAccounts,
} from "@/lib/accounts";
import {APP_PATHS} from "@/lib/app-paths";
import {switchAccount} from "./switch-account";

/**
 * Signs out of one account.
 *
 * Signing out of the one currently in use falls through to whichever account
 * was signed in most recently, so the other accounts are not signed out with
 * it. Signing out of the last one leaves nobody signed in.
 */
export async function signOutAccount(id: string): Promise<{signedIn: boolean}> {
  const wasActive = id === (await activeSessionId());

  await forgetAccount(id);

  if (!wasActive) {
    revalidatePath(APP_PATHS.dashboard.index, "layout");

    return {signedIn: true};
  }

  const next = (await readAccounts()).find((account) => account.id !== id);

  // the tokens go before anything else does: switching writes down whatever
  // session is in use first, and the one being signed out of is not to come
  // back that way.
  await clearActiveSession();

  if (!next) {
    return {signedIn: false};
  }

  const {ok} = await switchAccount(next.id);
  if (!ok) {
    await clearActiveSession();
  }

  return {signedIn: ok};
}

/** Signs out of every account at once, leaving nothing behind. */
export async function signOutEveryAccount(): Promise<void> {
  await forgetAllAccounts();
  await clearActiveSession();

  revalidatePath(APP_PATHS.dashboard.index, "layout");
}
