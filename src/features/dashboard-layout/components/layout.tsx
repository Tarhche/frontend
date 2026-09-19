import {cookies} from "next/headers";
import {ScrollArea} from "@mantine/core";
import {LayoutShell, LayoutMain, LayoutNavbar} from "./layout-shell";
import {LayoutSidebar} from "./layout-sidebar";
import {
  AccountSwitcher,
  ImpersonationBanner,
  type SwitchableAccount,
} from "@/features/accounts";
import {fetchUserProfile} from "@/dal/private/profile";
import {activeSessionId, readAccounts} from "@/lib/accounts";
import {getUserPermissions} from "@/lib/auth";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {APP_PATHS} from "@/lib/app-paths";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import classes from "./layout.module.css";

type Props = {
  children: React.ReactNode;
};

export async function DashboardLayout({children}: Props) {
  const userPermissions = await getUserPermissions();

  const store = await cookies();
  const publicLanguageCode = await resolvePreferredLanguageCode({
    accessToken: store.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    cookieLanguage: store.get(LANGUAGE_COOKIE_NAME)?.value,
  });
  const homeHref = publicLanguageCode ? `/${publicLanguageCode}` : "/";

  // the profile is the one thing that says, on the backend's authority, who
  // this session acts as and who is behind it
  const profile = await fetchUserProfile()
    .then((response) => response.data)
    .catch(() => null);
  const activeId = await activeSessionId();
  const accounts = withActiveAccount(await readAccounts(), activeId, profile);
  const impersonator = profile?.impersonated_by;

  return (
    <LayoutShell homeHref={homeHref}>
      <LayoutNavbar className={classes.navbar}>
        <ScrollArea
          className={classes.navbarMain}
          type="hover"
          scrollbars="y"
          scrollHideDelay={0}
        >
          <LayoutSidebar userPermissions={userPermissions || []} />
        </ScrollArea>
        <div className={classes.footer}>
          <AccountSwitcher
            accounts={accounts}
            activeId={activeId}
            addAccountHref={`${APP_PATHS.auth.login}?callbackUrl=${APP_PATHS.dashboard.index}`}
          />
        </div>
      </LayoutNavbar>
      <LayoutMain h={0}>
        {impersonator ? (
          <ImpersonationBanner
            viewedAs={profile?.name || profile?.username || profile?.uuid}
            impersonator={{
              uuid: impersonator.uuid,
              name:
                impersonator.name || impersonator.username || impersonator.uuid,
            }}
          />
        ) : null}
        {children}
      </LayoutMain>
    </LayoutShell>
  );
}

// The session in use is always listed, under the name the backend gives it,
// whether or not it was ever written down as an account — a browser signed in
// before any of this existed still knows who it is.
function withActiveAccount(
  accounts: SwitchableAccount[],
  activeId: string | null,
  profile: {
    uuid: string;
    name?: string;
    username?: string;
    avatar?: string;
    impersonated_by?: {uuid: string; name?: string; username?: string};
  } | null,
): SwitchableAccount[] {
  if (!activeId || !profile) {
    return accounts;
  }

  const active: SwitchableAccount = {
    id: activeId,
    uuid: profile.uuid,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
    impersonatorUuid: profile.impersonated_by?.uuid,
    impersonatorName:
      profile.impersonated_by?.name ?? profile.impersonated_by?.username,
  };

  return [active, ...accounts.filter((account) => account.id !== activeId)];
}
