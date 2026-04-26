"use client";

import Link from "@/components/link";
import {ColorSchemeToggle} from "@/components/color-scheme-toggle";
import {
  AppShell,
  Burger,
  Group,
  Anchor,
  ActionIcon,
  Indicator,
} from "@mantine/core";
import {IconBell} from "@tabler/icons-react";
import {useDisclosure} from "@mantine/hooks";

type Props = {
  children: React.ReactNode;
};

export function LayoutShell({children}: Props) {
  const [mobileOpened, {toggle: toggleMobile}] = useDisclosure();
  const [desktopOpened, {toggle: toggleDesktop}] = useDisclosure(true);

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
            <Anchor component={Link} href={"/"} c="bright" underline="never">
              طرح‌چه
            </Anchor>
          </Group>
          <Group h="100%" align="center">
            <Indicator color="red" size={8} offset={2}>
              <ActionIcon variant="light" size="lg" radius="md">
                <IconBell style={{width: "70%", height: "70%"}} stroke={1.5} />
              </ActionIcon>
            </Indicator>
            <Indicator disabled>
              <ColorSchemeToggle />
            </Indicator>
          </Group>
        </Group>
      </AppShell.Header>
      {children}
    </AppShell>
  );
}

export const LayoutNavbar = AppShell.Navbar;
export const LayoutMain = AppShell.Main;
