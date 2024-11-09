"use client";
import Link from "next/link";
import {type ReactNode} from "react";
import {
  AppShell,
  Burger,
  Group,
  Text,
  ActionIcon,
  Indicator,
  useMantineColorScheme,
  UnstyledButton,
  ScrollArea,
} from "@mantine/core";
import {LayoutSidebar} from "./layout-sidebar";
import {IconMoon, IconSun, IconBell, IconLogout} from "@tabler/icons-react";
import {useDisclosure} from "@mantine/hooks";
import {logout} from "@/features/dashboard/actions/logout";
import classes from "./layout.module.css";

type Props = {
  children: ReactNode;
};

export function DashboardLayout({children}: Props) {
  const [mobileOpened, {toggle: toggleMobile}] = useDisclosure();
  const [desktopOpened, {toggle: toggleDesktop}] = useDisclosure(true);
  const {toggleColorScheme} = useMantineColorScheme();

  return (
    <AppShell
      header={{height: 60}}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: {mobile: !mobileOpened, desktop: !desktopOpened},
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px={16} justify="space-between" align="center">
          <Group>
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
            <Text component={Link} href={"/"}>
              طرحچه
            </Text>
          </Group>
          <Group h="100%" px="md" align="center">
            <Indicator color="red" size={8} offset={2}>
              <ActionIcon variant="light" size="lg" radius="md">
                <IconBell style={{width: "70%", height: "70%"}} stroke={1.5} />
              </ActionIcon>
            </Indicator>
            <Indicator disabled>
              <ActionIcon
                variant="light"
                size="lg"
                radius="md"
                onClick={toggleColorScheme}
              >
                <IconSun
                  style={{width: "70%", height: "70%"}}
                  stroke={1.5}
                  className={classes.light}
                />
                <IconMoon
                  style={{width: "70%", height: "70%"}}
                  stroke={1.5}
                  className={classes.dark}
                />
              </ActionIcon>
            </Indicator>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar className={classes.navbar}>
        <ScrollArea
          className={classes.navbarMain}
          type="hover"
          scrollbars="y"
          scrollHideDelay={0}
        >
          <LayoutSidebar />
        </ScrollArea>
        <div className={classes.footer}>
          <form action={logout}>
            <UnstyledButton w={"100%"} type="submit" className={classes.link}>
              <IconLogout className={classes.linkIcon} stroke={1.5} />
              <span>خروج</span>
            </UnstyledButton>
          </form>
        </div>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
