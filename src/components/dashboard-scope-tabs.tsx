"use client";

import {IconUser, IconUsersGroup} from "@tabler/icons-react";
import {ContentTabs, type ContentTab} from "@/components/content-tabs";
import {type DashboardScope} from "@/lib/dashboard-scope/shared";

export type ScopeTab = {
  scope: DashboardScope;
  label: string;
  href: string;
};

type Props = {
  // Only the scopes the caller may list — a scope they lack has no tab at all.
  tabs: ScopeTab[];
  active: DashboardScope;
};

const SCOPE_ICONS = {
  all: IconUsersGroup,
  own: IconUser,
};

// Switches a dashboard listing between everybody's rows and the caller's own.
// The icons live here rather than in the page because server components can't
// hand component references to client ones.
export function DashboardScopeTabs({tabs, active}: Props) {
  const contentTabs: ContentTab[] = tabs.map(({scope, label, href}) => ({
    value: scope,
    label,
    icon: SCOPE_ICONS[scope],
    href,
  }));

  return <ContentTabs tabs={contentTabs} active={active} />;
}
