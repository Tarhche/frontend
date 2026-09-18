import "server-only";
import {cookies} from "next/headers";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXP,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_COOKIE_EXP,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
} from "@/constants";
import {languageFromAccessToken} from "@/lib/language/resolve";
import {sessionClaims, sessionId} from "./session";
import {fetchProfileWithToken} from "./profile";
import type {StoredAccount} from "./types";

/**
 * Where the browser keeps the sessions it is signed in to.
 *
 * One cookie per account rather than one cookie holding them all: a cookie that
 * outgrows 4KB is dropped by the browser without a word, and losing one account
 * that way is better than losing every account at once.
 *
 * The active session stays in the ordinary `access_token`/`refresh_token`
 * cookies, so everything that reads a token — the server DAL, the refresh
 * route, the middleware — keeps working without knowing any of this exists.
 * Switching accounts swaps which stored session those two cookies hold.
 */
const ACCOUNT_COOKIE_PREFIX = "account_";

/** How many accounts are kept. Each one costs a cookie on every request. */
const MAX_ACCOUNTS = 4;

export async function readAccounts(): Promise<StoredAccount[]> {
  const store = await cookies();

  return store
    .getAll()
    .filter(({name}) => name.startsWith(ACCOUNT_COOKIE_PREFIX))
    .map(({value}) => decodeAccount(value))
    .filter((account): account is StoredAccount => account !== null)
    .sort((a, b) => b.rememberedAt - a.rememberedAt);
}

export async function readAccount(id: string): Promise<StoredAccount | null> {
  const accounts = await readAccounts();

  return accounts.find((account) => account.id === id) ?? null;
}

/** Which of the stored accounts the cookies are currently signed in as. */
export async function activeSessionId(): Promise<string | null> {
  const store = await cookies();
  const claims = sessionClaims(store.get(ACCESS_TOKEN_COOKIE_NAME)?.value);

  return claims ? sessionId(claims) : null;
}

/**
 * Writes an account down, keeping whatever was already known about it. A
 * session recorded without a name — because the profile could not be read at
 * that moment — does not erase the name it was recorded with before.
 */
export async function rememberAccount(
  account: Omit<StoredAccount, "rememberedAt">,
): Promise<void> {
  const store = await cookies();
  const known = await readAccount(account.id);

  const remembered: StoredAccount = {
    ...known,
    ...definedOnly(account),
    id: account.id,
    uuid: account.uuid,
    refreshToken: account.refreshToken,
    rememberedAt: Date.now(),
  };

  // nothing in the browser reads these, so nothing in the browser needs to:
  // they hold refresh tokens, and only the server ever spends one.
  store.set(cookieName(account.id), encodeAccount(remembered), {
    maxAge: REFRESH_TOKEN_EXP,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  await pruneAccounts(account.id);
}

export async function forgetAccount(id: string): Promise<void> {
  const store = await cookies();

  store.set(cookieName(id), "", {maxAge: -1, path: "/"});
}

export async function forgetAllAccounts(): Promise<void> {
  for (const account of await readAccounts()) {
    await forgetAccount(account.id);
  }
}

/**
 * Writes down a session, under the name the backend gives it.
 *
 * The label is read with that session's own token rather than taken from the
 * page, so an account is never listed under a name somebody else supplied.
 */
export async function rememberSession(tokens: {
  access_token: string;
  refresh_token: string;
}): Promise<void> {
  const claims = sessionClaims(tokens.access_token);
  if (!claims) {
    return;
  }

  const profile = await fetchProfileWithToken(tokens.access_token);

  await rememberAccount({
    id: sessionId(claims),
    uuid: claims.sub,
    name: profile?.name,
    username: profile?.username,
    avatar: profile?.avatar,
    impersonatorUuid: claims.impersonator,
    impersonatorName: profile?.impersonated_by?.name,
    refreshToken: tokens.refresh_token,
  });
}

/**
 * Records whichever session the cookies hold right now, so that switching away
 * from it can come back to it.
 */
export async function rememberActiveSession(): Promise<void> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!accessToken || !refreshToken) {
    return;
  }

  await rememberSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

/**
 * Makes a pair of tokens the session the browser is in. The in-use language
 * follows the account, the same way it does at login.
 */
export async function setActiveSession(tokens: {
  access_token: string;
  refresh_token: string;
}): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE_NAME, tokens.access_token, {
    maxAge: ACCESS_TOKEN_EXP,
    path: "/",
    httpOnly: false,
    secure: true,
  });

  store.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
    maxAge: REFRESH_TOKEN_EXP,
    path: "/",
    httpOnly: false,
    secure: true,
  });

  const language = languageFromAccessToken(tokens.access_token);
  if (language) {
    store.set(LANGUAGE_COOKIE_NAME, language, {
      maxAge: LANGUAGE_COOKIE_EXP,
      path: "/",
    });
  }
}

/** Signs out of whatever session the cookies hold, leaving the store alone. */
export async function clearActiveSession(): Promise<void> {
  const store = await cookies();

  store.set(ACCESS_TOKEN_COOKIE_NAME, "", {maxAge: -1, path: "/"});
  store.set(REFRESH_TOKEN_COOKIE_NAME, "", {maxAge: -1, path: "/"});
}

function cookieName(id: string): string {
  return `${ACCOUNT_COOKIE_PREFIX}${id}`;
}

// base64 keeps the value out of reach of cookie encoding, which would otherwise
// spend a third of the room escaping the punctuation in JSON.
function encodeAccount(account: StoredAccount): string {
  return Buffer.from(JSON.stringify(account), "utf8").toString("base64url");
}

function decodeAccount(value: string): StoredAccount | null {
  try {
    const account = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as StoredAccount;

    return account.id && account.uuid && account.refreshToken ? account : null;
  } catch {
    return null;
  }
}

function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

// The oldest go first, and neither the active session nor the one just written
// is ever the one to go.
async function pruneAccounts(keepId: string): Promise<void> {
  const accounts = await readAccounts();
  if (accounts.length <= MAX_ACCOUNTS) {
    return;
  }

  const activeId = await activeSessionId();
  const prunable = accounts
    .filter(({id}) => id !== keepId && id !== activeId)
    .reverse();

  for (const account of prunable.slice(0, accounts.length - MAX_ACCOUNTS)) {
    await forgetAccount(account.id);
  }
}
