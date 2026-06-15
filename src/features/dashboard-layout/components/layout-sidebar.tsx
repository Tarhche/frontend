"use client";

import Link from "@/components/link";
import {usePathname} from "next/navigation";
import {useTranslations} from "@/i18n/provider";
import {UnstyledButton} from "@mantine/core";
import {
  IconNotes,
  IconHome,
  IconFile,
  IconMessage,
  IconSettings,
  IconBookmarks,
  IconMessages,
  IconUsers,
  IconKey,
  IconUser,
  IconLanguage,
  IconPictureInPicture,
} from "@tabler/icons-react";
import {hasPermission} from "@/lib/auth/shared";
import {APP_PATHS} from "@/lib/app-paths";
import {Permissions} from "@/lib/app-permissions";
import classes from "./layout.module.css";

type Props = {
  userPermissions: string[];
};

const dashboard = APP_PATHS.dashboard;

type SidebarSchema = {
  labelKey: string;
  icon: any;
  href: string;
  requiredPermissions: Permissions[];
};

const SIDE_BAR_DATA: SidebarSchema[] = [
  {
    labelKey: "nav.dashboard",
    icon: IconHome,
    href: dashboard.index,
    requiredPermissions: [],
  },
  {
    labelKey: "dashboard.sidebar.articles",
    icon: IconNotes,
    href: dashboard.articles.index,
    requiredPermissions: ["articles.index"],
  },
  {
    labelKey: "dashboard.sidebar.comments",
    icon: IconMessages,
    href: dashboard.comments.index,
    requiredPermissions: ["comments.index"],
  },
  {
    labelKey: "dashboard.sidebar.files",
    icon: IconFile,
    href: dashboard.files,
    requiredPermissions: ["files.index", "self.files.index"],
  },
  {
    labelKey: "dashboard.sidebar.myComments",
    icon: IconMessage,
    href: dashboard.my.comments,
    requiredPermissions: ["self.comments.index"],
  },
  {
    labelKey: "dashboard.sidebar.elements",
    icon: IconPictureInPicture,
    href: dashboard.elements.index,
    requiredPermissions: ["elements.index"],
  },
  {
    labelKey: "dashboard.sidebar.myBookmarks",
    icon: IconBookmarks,
    href: dashboard.my.bookmarks,
    requiredPermissions: ["self.bookmarks.index"],
  },
  {
    labelKey: "dashboard.sidebar.users",
    icon: IconUsers,
    href: dashboard.users.index,
    requiredPermissions: ["users.index"],
  },
  {
    labelKey: "dashboard.sidebar.roles",
    icon: IconKey,
    href: dashboard.roles.index,
    requiredPermissions: ["roles.index"],
  },
  {
    labelKey: "dashboard.sidebar.languages",
    icon: IconLanguage,
    href: dashboard.languages.index,
    requiredPermissions: ["languages.index"],
  },
  {
    labelKey: "dashboard.sidebar.settings",
    icon: IconSettings,
    href: dashboard.settings,
    requiredPermissions: ["config.show"],
  },
  {
    labelKey: "dashboard.sidebar.profile",
    icon: IconUser,
    href: dashboard.profile.index,
    requiredPermissions: [],
  },
];

export function LayoutSidebar({userPermissions}: Props) {
  const t = useTranslations();
  const pathname = usePathname();

  return SIDE_BAR_DATA.map((item) => {
    const hasAccess = hasPermission(userPermissions, item.requiredPermissions);

    if (hasAccess) {
      return (
        <UnstyledButton
          component={Link}
          className={classes.link}
          href={item.href}
          key={item.labelKey}
          mb={5}
          data-active={pathname === item.href || undefined}
        >
          <item.icon className={classes.linkIcon} stroke={1.5} />
          <span>{t(item.labelKey)}</span>
        </UnstyledButton>
      );
    }

    return null;
  });
}
