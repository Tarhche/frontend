"use client";

import {ActionIcon, Tooltip} from "@mantine/core";
import {IconPencil} from "@tabler/icons-react";
import Link from "@/components/link";
import {useInit} from "@/hooks/data/init";
import {useTranslations} from "@/i18n/provider";
import {type Permissions} from "@/lib/app-permissions";
// Imported from `shared` rather than `@/lib/auth`, whose barrel also pulls in the
// server-only token helpers.
import {hasPermission} from "@/lib/auth/shared";
import classes from "./edit-content-button.module.css";

type Props = {
  // A dashboard path — `Link` leaves `/dashboard/*` unprefixed by language.
  href: string;
  // The permission the dashboard page behind `href` requires.
  permission: Permissions;
  // Pins the button to the top inline-end corner of the nearest positioned
  // ancestor, for content that has no toolbar of its own to sit in.
  floating?: boolean;
};

// Shortcut from a public page to wherever that content is edited in the
// dashboard. Renders nothing for visitors who are logged out or who lack the
// permission, so the button never leads to a page the API would refuse.
export function EditContentButton({href, permission, floating = false}: Props) {
  const t = useTranslations();
  const {data} = useInit();

  if (
    data?.status !== "authenticated" ||
    !hasPermission(data.permissions, [permission])
  ) {
    return null;
  }

  return (
    <Tooltip label={t("common.editInDashboard")} withArrow>
      <ActionIcon
        component={Link}
        href={href}
        variant="transparent"
        color="dimmed"
        aria-label={t("common.editInDashboard")}
        className={floating ? classes.floating : undefined}
      >
        <IconPencil size={20} />
      </ActionIcon>
    </Tooltip>
  );
}
