"use client";

import {Breadcrumbs} from "@/components/breadcrumbs";
import {useTranslations} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";

type Props = {
  crumbs: {
    label: string;
    href?: string;
  }[];
};

export function DashboardBreadcrumbs({crumbs}: Props) {
  const t = useTranslations();

  return (
    <Breadcrumbs
      crumbs={[
        {
          label: t("nav.dashboard"),
          href: `${APP_PATHS.dashboard.index}`,
        },
        ...crumbs,
      ]}
    />
  );
}
