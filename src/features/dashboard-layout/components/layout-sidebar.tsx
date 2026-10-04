"use client";

import Link from "@/components/link";
import {usePathname} from "next/navigation";
import {useTranslations} from "@/i18n/provider";
import {Text, UnstyledButton} from "@mantine/core";
import {
  isActive,
  isGroup,
  SIDEBAR,
  type SidebarLink,
  visibleSidebar,
} from "./sidebar-items";
import classes from "./layout.module.css";

type Props = {
  userPermissions: string[];
};

export function LayoutSidebar({userPermissions}: Props) {
  const t = useTranslations();
  const pathname = usePathname();

  const link = (item: SidebarLink) => (
    <UnstyledButton
      component={Link}
      className={classes.link}
      href={item.href}
      key={item.labelKey}
      mb={5}
      data-active={isActive(item.href, pathname) || undefined}
    >
      <item.icon className={classes.linkIcon} stroke={1.5} />
      <span>{t(item.labelKey)}</span>
    </UnstyledButton>
  );

  return visibleSidebar(SIDEBAR, userPermissions).map((entry) =>
    isGroup(entry) ? (
      <div key={entry.labelKey} className={classes.group}>
        <Text component="div" className={classes.groupLabel}>
          {t(entry.labelKey)}
        </Text>
        {entry.links.map(link)}
      </div>
    ) : (
      link(entry)
    ),
  );
}
