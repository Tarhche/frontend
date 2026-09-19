"use server";

import {headers} from "next/headers";
import {revalidatePath} from "next/cache";
import {
  clearActiveSession,
  forgetAccount,
  readAccount,
  readAccounts,
  rememberAccount,
  rememberActiveSession,
  setActiveSession,
  activeSessionId,
} from "@/lib/accounts";
import {refreshCoordinator} from "@/lib/auth/refresh/RefreshCoordinator";
import {resolveClientIp} from "@/lib/client-ip";
import {APP_PATHS} from "@/lib/app-paths";

export type SwitchResult = {
  ok: boolean;
  /** the account's session has run out and it was dropped from the list. */
  expired?: boolean;
};

/**
 * Makes one of the signed-in accounts the one the browser is in.
 *
 * A stored account is a refresh token, so switching is an exchange: the token
 * buys a fresh pair, and the pair becomes the active session. The session being
 * left is written down first, so it can be come back to.
 */
export async function switchAccount(id: string): Promise<SwitchResult> {
  const account = await readAccount(id);
  if (!account) {
    return {ok: false};
  }

  if (id === (await activeSessionId())) {
    return {ok: true};
  }

  await rememberActiveSession();

  let tokens;
  try {
    tokens = await refreshCoordinator.swap(
      account.refreshToken,
      resolveClientIp(await headers()),
    );
  } catch {
    // the refresh token is spent or expired: this account is not signed in any
    // more, and saying so is more use than an account that cannot be reached
    await forgetAccount(id);

    return {ok: false, expired: true};
  }

  await setActiveSession(tokens);
  await rememberAccount({...account, refreshToken: tokens.refresh_token});

  revalidatePath(APP_PATHS.dashboard.index, "layout");

  return {ok: true};
}

/**
 * Leaves a shadow session for the account of whoever opened it.
 *
 * It is a switch like any other: the impersonator's own session is one of the
 * signed-in accounts, and going back to it is going back to them.
 */
export async function leaveImpersonation(
  impersonatorUuid: string,
): Promise<SwitchResult> {
  const accounts = await readAccounts();
  const own = accounts.find(
    (account) => account.uuid === impersonatorUuid && !account.impersonatorUuid,
  );

  if (!own) {
    // their session was not written down, or has since been signed out of;
    // there is nothing to go back to but the login page
    await clearActiveSession();

    return {ok: false};
  }

  return switchAccount(own.id);
}
