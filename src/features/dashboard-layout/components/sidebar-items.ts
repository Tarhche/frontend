import {type ComponentType} from "react";
import {
  IconBookmarks,
  IconBox,
  IconCamera,
  IconCloudComputing,
  IconDatabase,
  IconFile,
  IconHome,
  IconKey,
  IconLanguage,
  IconMail,
  IconMessages,
  IconNetwork,
  IconNotes,
  IconPackage,
  IconPictureInPicture,
  IconServer2,
  IconSettings,
  IconStack2,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import {APP_PATHS} from "@/lib/app-paths";
import {type Permissions} from "@/lib/app-permissions";
import {hasPermission} from "@/lib/auth/shared";

type SidebarIcon = ComponentType<{className?: string; stroke?: number}>;

/** One page in the sidebar, shown to whoever holds any of its permissions. */
export type SidebarLink = {
  labelKey: string;
  icon: SidebarIcon;
  href: string;
  requiredPermissions: Permissions[];
};

/**
 * Pages that belong together, under an entry of their own that opens to show
 * them and closes to put them away.
 */
export type SidebarGroup = {
  labelKey: string;
  icon: SidebarIcon;
  links: SidebarLink[];
};

export type SidebarEntry = SidebarLink | SidebarGroup;

export function isGroup(entry: SidebarEntry): entry is SidebarGroup {
  return "links" in entry;
}

const dashboard = APP_PATHS.dashboard;

// a Docker VM's images, networks and volumes are under the same permissions
// as its containers.
const CONTAINERS: Permissions[] = [
  "workload.containers.index",
  "self.workload.containers.index",
];

export const SIDEBAR: SidebarEntry[] = [
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
    requiredPermissions: ["articles.index", "self.articles.index"],
  },
  {
    labelKey: "dashboard.sidebar.comments",
    icon: IconMessages,
    href: dashboard.comments.index,
    requiredPermissions: ["comments.index", "self.comments.index"],
  },
  {
    labelKey: "dashboard.sidebar.files",
    icon: IconFile,
    href: dashboard.files,
    requiredPermissions: ["files.index", "self.files.index"],
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
    labelKey: "dashboard.sidebar.contactUs",
    icon: IconMail,
    href: dashboard.contactUs.index,
    requiredPermissions: ["contactus.index"],
  },
  {
    labelKey: "dashboard.sidebar.workloads",
    icon: IconCloudComputing,
    links: [
      {
        labelKey: "dashboard.sidebar.vms",
        icon: IconServer2,
        href: dashboard.vms.index,
        requiredPermissions: ["workload.vms.index", "self.workload.vms.index"],
      },
      {
        labelKey: "dashboard.sidebar.snapshots",
        icon: IconCamera,
        href: dashboard.snapshots.index,
        requiredPermissions: [
          "workload.snapshots.index",
          "self.workload.snapshots.index",
        ],
      },
      {
        labelKey: "dashboard.sidebar.containers",
        icon: IconBox,
        href: dashboard.containers.index,
        requiredPermissions: CONTAINERS,
      },
      {
        labelKey: "dashboard.sidebar.images",
        icon: IconPackage,
        href: dashboard.images.index,
        requiredPermissions: CONTAINERS,
      },
      {
        labelKey: "dashboard.sidebar.networks",
        icon: IconNetwork,
        href: dashboard.networks.index,
        requiredPermissions: CONTAINERS,
      },
      {
        labelKey: "dashboard.sidebar.volumes",
        icon: IconDatabase,
        href: dashboard.volumes.index,
        requiredPermissions: CONTAINERS,
      },
      {
        labelKey: "dashboard.sidebar.stacks",
        icon: IconStack2,
        href: dashboard.stacks.index,
        requiredPermissions: [
          "workload.stacks.index",
          "self.workload.stacks.index",
        ],
      },
    ],
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

/**
 * What of the sidebar somebody sees: each page they hold any of its
 * permissions for -- over everybody's or over their own -- and each group
 * with something left in it.
 */
export function visibleSidebar(
  entries: readonly SidebarEntry[],
  permissions: string[],
): SidebarEntry[] {
  return entries.flatMap((entry): SidebarEntry[] => {
    if (!isGroup(entry)) {
      return hasPermission(permissions, entry.requiredPermissions)
        ? [entry]
        : [];
    }

    const links = entry.links.filter((link) =>
      hasPermission(permissions, link.requiredPermissions),
    );

    return links.length > 0 ? [{...entry, links}] : [];
  });
}

/**
 * Whether a link is to the page being looked at, or to the page a page under
 * it belongs to: a VM's page is one of the VMs.
 */
export function isActive(href: string, pathname: string): boolean {
  if (href === dashboard.index) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Whether the page being looked at is one of a group's pages, or under one. */
export function holdsActive(group: SidebarGroup, pathname: string): boolean {
  return group.links.some((link) => isActive(link.href, pathname));
}
