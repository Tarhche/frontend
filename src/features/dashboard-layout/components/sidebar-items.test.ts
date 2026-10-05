import {
  holdsActive,
  isActive,
  isGroup,
  SIDEBAR,
  type SidebarGroup,
  visibleSidebar,
} from "./sidebar-items";

const WORKLOADS = "dashboard.sidebar.workloads";

/** The Workloads menu as it is, before anybody's permissions are asked. */
function workloads(): SidebarGroup {
  const group = SIDEBAR.find(
    (entry): entry is SidebarGroup =>
      isGroup(entry) && entry.labelKey === WORKLOADS,
  );

  if (!group) {
    throw new Error("there is no Workloads menu");
  }

  return group;
}

/** The workload's pages somebody with these permissions is shown. */
function workload(permissions: string[]): string[] {
  const group = visibleSidebar(SIDEBAR, permissions).find(
    (entry): entry is SidebarGroup =>
      isGroup(entry) && entry.labelKey === WORKLOADS,
  );

  return group ? group.links.map((link) => link.href) : [];
}

describe("the sidebar", () => {
  it("shows no workload to somebody who may see none of it", () => {
    expect(workload(["articles.index"])).toEqual([]);
    expect(
      visibleSidebar(SIDEBAR, ["articles.index"]).some(
        (entry) => entry.labelKey === WORKLOADS,
      ),
    ).toBe(false);
  });

  it("shows the VMs to somebody who may see only their own", () => {
    expect(workload(["self.workload.vms.index"])).toEqual(["/dashboard/vms"]);
  });

  it("shows the VMs to somebody who may see everybody's", () => {
    expect(workload(["workload.vms.index"])).toEqual(["/dashboard/vms"]);
  });

  it("shows each page by its own permission", () => {
    expect(workload(["self.workload.snapshots.index"])).toEqual([
      "/dashboard/snapshots",
    ]);
    expect(workload(["workload.stacks.index"])).toEqual(["/dashboard/stacks"]);
  });

  it("shows a Docker VM's images, networks and volumes with its containers", () => {
    expect(workload(["self.workload.containers.index"])).toEqual([
      "/dashboard/containers",
      "/dashboard/images",
      "/dashboard/networks",
      "/dashboard/volumes",
    ]);
  });

  it("shows all of the workload, in order, to somebody who may see all of it", () => {
    expect(
      workload([
        "workload.vms.index",
        "workload.snapshots.index",
        "workload.containers.index",
        "workload.stacks.index",
      ]),
    ).toEqual([
      "/dashboard/vms",
      "/dashboard/snapshots",
      "/dashboard/containers",
      "/dashboard/images",
      "/dashboard/networks",
      "/dashboard/volumes",
      "/dashboard/stacks",
    ]);
  });

  it("has no tasks any more", () => {
    const hrefs = SIDEBAR.flatMap((entry) =>
      isGroup(entry) ? entry.links.map((link) => link.href) : [entry.href],
    );

    expect(hrefs.some((href) => href.includes("/tasks"))).toBe(false);
  });

  it("keeps everything else as it was", () => {
    const shown = visibleSidebar(SIDEBAR, ["users.index"]).map(
      (entry) => entry.labelKey,
    );

    expect(shown).toEqual([
      "nav.dashboard",
      "dashboard.sidebar.users",
      "dashboard.sidebar.profile",
    ]);
  });

  it("puts the users, roles, languages and the rest beside the Workloads menu rather than in it", () => {
    const everything = [
      "articles.index",
      "comments.index",
      "files.index",
      "elements.index",
      "self.bookmarks.index",
      "contactus.index",
      "workload.vms.index",
      "workload.snapshots.index",
      "workload.containers.index",
      "workload.stacks.index",
      "users.index",
      "roles.index",
      "languages.index",
      "config.show",
    ];

    expect(
      visibleSidebar(SIDEBAR, everything).map((entry) => entry.labelKey),
    ).toEqual([
      "nav.dashboard",
      "dashboard.sidebar.articles",
      "dashboard.sidebar.comments",
      "dashboard.sidebar.files",
      "dashboard.sidebar.elements",
      "dashboard.sidebar.myBookmarks",
      "dashboard.sidebar.contactUs",
      WORKLOADS,
      "dashboard.sidebar.users",
      "dashboard.sidebar.roles",
      "dashboard.sidebar.languages",
      "dashboard.sidebar.settings",
      "dashboard.sidebar.profile",
    ]);
    expect(workloads().links.map((link) => link.labelKey)).toEqual([
      "dashboard.sidebar.vms",
      "dashboard.sidebar.snapshots",
      "dashboard.sidebar.containers",
      "dashboard.sidebar.images",
      "dashboard.sidebar.networks",
      "dashboard.sidebar.volumes",
      "dashboard.sidebar.stacks",
    ]);
  });

  it("marks a page as the one being looked at, and the pages under it", () => {
    expect(isActive("/dashboard/vms", "/dashboard/vms")).toBe(true);
    expect(isActive("/dashboard/vms", "/dashboard/vms/abc")).toBe(true);
    expect(isActive("/dashboard/vms", "/dashboard/vmsx")).toBe(false);
    expect(isActive("/dashboard", "/dashboard/vms")).toBe(false);
    expect(isActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("knows the Workloads menu holds the page being looked at, or the page it is under", () => {
    expect(holdsActive(workloads(), "/dashboard/stacks")).toBe(true);
    expect(holdsActive(workloads(), "/dashboard/vms/abc")).toBe(true);
    expect(holdsActive(workloads(), "/dashboard/users")).toBe(false);
    expect(holdsActive(workloads(), "/dashboard")).toBe(false);
  });
});
