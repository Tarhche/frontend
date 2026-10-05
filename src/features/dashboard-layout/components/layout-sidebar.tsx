"use client";

import {useId, useState} from "react";
import Link from "@/components/link";
import {usePathname} from "next/navigation";
import {useTranslations} from "@/i18n/provider";
import {Collapse, UnstyledButton} from "@mantine/core";
import {IconChevronRight} from "@tabler/icons-react";
import {
  holdsActive,
  isActive,
  isGroup,
  SIDEBAR,
  type SidebarGroup,
  type SidebarLink,
  visibleSidebar,
} from "./sidebar-items";
import classes from "./layout.module.css";

type Props = {
  userPermissions: string[];
};

export function LayoutSidebar({userPermissions}: Props) {
  const pathname = usePathname();

  return visibleSidebar(SIDEBAR, userPermissions).map((entry) =>
    isGroup(entry) ? (
      <SidebarLinksGroup
        key={entry.labelKey}
        group={entry}
        pathname={pathname}
      />
    ) : (
      <SidebarItem key={entry.labelKey} link={entry} pathname={pathname} />
    ),
  );
}

type ItemProps = {
  link: SidebarLink;
  pathname: string;
};

function SidebarItem({link, pathname}: ItemProps) {
  const t = useTranslations();
  const active = isActive(link.href, pathname);

  return (
    <UnstyledButton
      component={Link}
      className={classes.link}
      href={link.href}
      mb={5}
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
    >
      <link.icon className={classes.linkIcon} stroke={1.5} />
      <span>{t(link.labelKey)}</span>
    </UnstyledButton>
  );
}

type GroupProps = {
  group: SidebarGroup;
  pathname: string;
};

/**
 * An entry that opens to show the pages under it, and closes to put them
 * away. It is open on one of its pages, and opens again whenever somebody
 * comes to one of them from elsewhere; otherwise it is left as they put it.
 */
function SidebarLinksGroup({group, pathname}: GroupProps) {
  const t = useTranslations();
  const buttonId = useId();
  const linksId = useId();
  const holdsCurrentPage = holdsActive(group, pathname);
  const [opened, setOpened] = useState(holdsCurrentPage);
  const [heldCurrentPage, setHeldCurrentPage] = useState(holdsCurrentPage);

  if (holdsCurrentPage !== heldCurrentPage) {
    setHeldCurrentPage(holdsCurrentPage);
    if (holdsCurrentPage) {
      setOpened(true);
    }
  }

  return (
    <>
      <UnstyledButton
        id={buttonId}
        className={classes.link}
        w="100%"
        mb={5}
        aria-expanded={opened}
        aria-controls={linksId}
        onClick={() => setOpened((isOpened) => !isOpened)}
      >
        <group.icon className={classes.linkIcon} stroke={1.5} />
        <span>{t(group.labelKey)}</span>
        <IconChevronRight
          className={classes.chevron}
          stroke={1.5}
          aria-hidden
        />
      </UnstyledButton>
      <Collapse
        expanded={opened}
        id={linksId}
        role="group"
        aria-labelledby={buttonId}
      >
        <div className={classes.groupLinks}>
          {group.links.map((link) => (
            <SidebarItem key={link.labelKey} link={link} pathname={pathname} />
          ))}
        </div>
      </Collapse>
    </>
  );
}
