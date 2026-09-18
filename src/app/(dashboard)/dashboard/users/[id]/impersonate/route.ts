import {NextRequest, NextResponse} from "next/server";
import {impersonateUser} from "@/dal/private/users";
import {
  rememberAccount,
  rememberActiveSession,
  sessionClaims,
  sessionId,
  setActiveSession,
} from "@/lib/accounts";
import {APP_PATHS} from "@/lib/app-paths";

/**
 * Signs the browser in as another user and lands on their dashboard.
 *
 * It is a navigation rather than a button that posts, because the whole point
 * is to open in a new tab: a tab opened after an awaited action is a popup as
 * far as the browser is concerned, and gets blocked. A plain link is not.
 *
 * It has to be a real navigation — the link carries `target="_blank"` — since
 * anything the router fetches in the background, a prefetch above all, is
 * refused rather than quietly signed in as somebody else.
 *
 * Whether the person may do this at all is the backend's answer — the endpoint
 * sits behind `users.impersonate` — and what is left here is that a navigation
 * this site did not start cannot trigger it. `Sec-Fetch-*` says which is which:
 * a link or an address typed by hand is a same-origin document navigation,
 * while anything a foreign page can arrange (an image, a script, a form post,
 * a link from elsewhere) is not.
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  if (!isOwnNavigation(request)) {
    return new NextResponse(null, {status: 403});
  }

  const {id} = await params;

  // whoever is asking has to be able to come back to themselves, so their own
  // session is written down before it stops being the active one.
  await rememberActiveSession();

  let session;
  try {
    session = await impersonateUser(id);
  } catch {
    return NextResponse.redirect(
      new URL(
        `${APP_PATHS.dashboard.users.index}?impersonation=failed`,
        request.url,
      ),
    );
  }

  const claims = sessionClaims(session.access_token);
  if (!claims) {
    return new NextResponse(null, {status: 500});
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

  return NextResponse.redirect(new URL(APP_PATHS.dashboard.index, request.url));
}

function isOwnNavigation(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  const dest = request.headers.get("sec-fetch-dest");

  // "none" is the address bar or a bookmark; a browser too old to say anything
  // is taken at its word, since the permission is still checked either way.
  if (site !== null && site !== "same-origin" && site !== "none") {
    return false;
  }

  return dest === null || dest === "document";
}
