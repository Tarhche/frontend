import {ScrollArea} from "@mantine/core";
import {LayoutShell, LayoutMain, LayoutNavbar} from "./layout-shell";
import {DashboardLayoutLogoutButton} from "./logout-button";
import {LayoutSidebar} from "./layout-sidebar";
import {getUserPermissions} from "@/lib/auth";
import classes from "./layout.module.css";

type Props = {
  children: React.ReactNode;
};

export async function DashboardLayout({children}: Props) {
  const userPermissions = await getUserPermissions();

  return (
    <LayoutShell>
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
