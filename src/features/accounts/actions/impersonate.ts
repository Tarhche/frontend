"use server";

import {impersonateUser} from "@/dal/private/users";
import {
  rememberAccount,
  rememberActiveSession,
  sessionClaims,
  sessionId,
  setActiveSession,
} from "@/lib/accounts";

export type ImpersonationResult = {
  ok: boolean;
  /** who the browser is now signed in as, for saying so. */
  name?: string;
};

/**
 * Signs the browser in as another user, alongside whoever is already here.
 *
 * Whether the person may do this at all is the backend's answer — the endpoint
 * sits behind `users.impersonate` — and a server action is what a page on
 * another site cannot reach, since Next refuses one whose origin is not ours.
 */
export async function impersonate(
  userUUID: string,
): Promise<ImpersonationResult> {
  // whoever is asking has to be able to come back to themselves, so their own
  // session is written down before it stops being the active one.
  await rememberActiveSession();

  let session;
  try {
    session = await impersonateUser(userUUID);
  } catch {
    return {ok: false};
  }

  const claims = sessionClaims(session.access_token);
  if (!claims) {
    return {ok: false};
  }

  await rememberAccount({
    id: sessionId(claims),
    uuid: claims.sub,
    name: session.user?.name,
    username: session.user?.username,
    avatar: session.user?.avatar,
    impersonatorUuid: claims.impersonator,
    refreshToken: session.refresh_token,
  });

  await setActiveSession(session);

  return {ok: true, name: session.user?.name || session.user?.username};
}
