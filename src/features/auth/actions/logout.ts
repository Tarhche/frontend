"use server";

import {activeSessionId} from "@/lib/accounts";
import {signOutAccount, signOutEveryAccount} from "@/features/accounts/actions";

/**
 * Signs out of the account in use.
 *
 * The browser can be signed in to several, so this leaves the others alone and
 * falls through to the one signed in most recently. It reports whether anybody
 * is still signed in afterwards, which is how the caller knows whether to stay
 * in the dashboard or leave it.
 */
export async function logout(): Promise<{signedIn: boolean}> {
  const id = await activeSessionId();
  if (!id) {
    await signOutEveryAccount();

    return {signedIn: false};
  }

  return signOutAccount(id);
}
