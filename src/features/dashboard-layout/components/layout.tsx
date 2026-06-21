import {cookies} from "next/headers";
import {ScrollArea} from "@mantine/core";
import {LayoutShell, LayoutMain, LayoutNavbar} from "./layout-shell";
import {DashboardLayoutLogoutButton} from "./logout-button";
import {LayoutSidebar} from "./layout-sidebar";
import {getUserPermissions} from "@/lib/auth";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
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
          <DashboardLayoutLogoutButton />
        </div>
      </LayoutNavbar>
      <LayoutMain h={0}>{children}</LayoutMain>
    </LayoutShell>
  );
}
