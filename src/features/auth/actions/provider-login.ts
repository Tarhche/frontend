"use server";

import {cookies} from "next/headers";
import {fetchProviderAuthorization, loginWithProvider} from "@/dal/public/auth";
import {
  rememberActiveSession,
  rememberSession,
  setActiveSession,
} from "@/lib/accounts";
import {OAUTH_HANDSHAKE_COOKIE_NAME, OAUTH_HANDSHAKE_EXP} from "@/constants";

export type BeginResult = {
  // where to send the browser. Empty when the login could not be started.
  url: string;
};

export type CompleteResult = {
  ok: boolean;
};

/**
 * Starts signing in with somebody else's account.
 *
 * What comes back from the provider has to be recognisable as an answer to this
 * question rather than to somebody else's, which is what the state is for: it
 * is kept here, out of reach of the page, and compared when the browser
 * returns. The cookie says which provider was asked, too — a state is only
 * worth anything against the question it was issued for.
 */
export async function beginProviderLogin(
  provider: string,
): Promise<BeginResult> {
  let authorization;
  try {
    authorization = await fetchProviderAuthorization(provider);
  } catch {
    return {url: ""};
  }

  if (!authorization?.url || !authorization?.state) {
    return {url: ""};
  }

  (await cookies()).set(
    OAUTH_HANDSHAKE_COOKIE_NAME,
    handshake(provider, authorization.state),
    {
      maxAge: OAUTH_HANDSHAKE_EXP,
      path: "/",
      httpOnly: true,
      secure: true,
      // the provider sends the browser back with an ordinary navigation, which
      // a lax cookie is sent on and a strict one is not
      sameSite: "lax",
    },
  );

  return {url: authorization.url};
}

/**
 * Finishes it: the code the provider handed the browser becomes a session here.
 *
 * The code is worth nothing on its own — only the backend can spend it, and it
 * can be spent once — so the answer to a replayed callback is the same as the
 * answer to a forged one.
 */
export async function completeProviderLogin(
  provider: string,
  code: string,
  state: string,
): Promise<CompleteResult> {
  const store = await cookies();
  const expected = store.get(OAUTH_HANDSHAKE_COOKIE_NAME)?.value;

  store.set(OAUTH_HANDSHAKE_COOKIE_NAME, "", {maxAge: -1, path: "/"});

  // a state that is not the one this browser was given is an answer to a
  // question somebody else asked
  if (!expected || expected !== handshake(provider, state)) {
    return {ok: false};
  }

  let session;
  try {
    session = await loginWithProvider(provider, code);
  } catch {
    return {ok: false};
  }

  if (!session?.access_token || !session?.refresh_token) {
    return {ok: false};
  }

  // signing in does not sign anybody out: whoever was here is written down
  // first, so both accounts are listed and either can be switched to
  await rememberActiveSession();

  await setActiveSession(session);
  await rememberSession(session);

  return {ok: true};
}

// handshake is what is compared: the provider that was asked and the state it
// was asked with, so neither can be swapped for another.
function handshake(provider: string, state: string): string {
  return `${provider}:${state}`;
}
