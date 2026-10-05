import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Collapse, createTheme, MantineProvider} from "@mantine/core";
import {LayoutSidebar} from "./layout-sidebar";

// the sidebar asks for its words in the reader's language; the dictionary is a
// detail of that, and what this is about is which words it asks for.
jest.mock("@/i18n/provider", () => ({
  useTranslations: () => (key: string) => key,
}));

let mockPathname = "/dashboard";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// opening and closing is the browser's to animate; here it is done at once.
const theme = createTheme({
  components: {
    Collapse: Collapse.extend({defaultProps: {transitionDuration: 0}}),
  },
});

const WORKLOADS = "dashboard.sidebar.workloads";

const ALL_OF_THE_WORKLOAD = [
  "workload.vms.index",
  "workload.snapshots.index",
  "workload.containers.index",
  "workload.stacks.index",
];

const THE_WORKLOAD_PAGES = [
  "/dashboard/vms",
  "/dashboard/snapshots",
  "/dashboard/containers",
  "/dashboard/images",
  "/dashboard/networks",
  "/dashboard/volumes",
  "/dashboard/stacks",
];

/** The sidebar of somebody with these permissions, on this page. */
function sidebar(userPermissions: string[], pathname = "/dashboard") {
  const tree = () => (
    <MantineProvider env="test" theme={theme}>
      <LayoutSidebar userPermissions={userPermissions} />
    </MantineProvider>
  );

  mockPathname = pathname;
  const view = render(tree());

  return {
    /** Goes to another page, the sidebar staying where it is. */
    goTo(next: string) {
      mockPathname = next;
      view.rerender(tree());
    },
  };
}

function menuButton() {
  return screen.getByRole("button", {name: WORKLOADS});
}

/** Where the pages the Workloads menu shows go, top to bottom. */
function shownInTheMenu(): string[] {
  const menu = screen.queryByRole("group", {name: WORKLOADS});

  return menu
    ? within(menu)
        .queryAllByRole("link")
        .map((link) => link.getAttribute("href") ?? "")
    : [];
}

function link(labelKey: string) {
  return screen.queryByRole("link", {name: labelKey});
}

describe("the Workloads menu", () => {
  it("is not there for somebody who may see none of the workload's pages", () => {
    sidebar(["users.index", "roles.index", "languages.index"]);

    expect(
      screen.queryByRole("button", {name: WORKLOADS}),
    ).not.toBeInTheDocument();
    expect(link("dashboard.sidebar.vms")).not.toBeInTheDocument();
    expect(link("dashboard.sidebar.users")).toBeInTheDocument();
  });

  it("shows somebody only the pages of it they may see", async () => {
    const user = userEvent.setup();
    sidebar(["self.workload.vms.index", "workload.stacks.index"]);

    await user.click(menuButton());

    expect(shownInTheMenu()).toEqual(["/dashboard/vms", "/dashboard/stacks"]);
  });

  it("shows a Docker VM's images, networks and volumes with its containers", async () => {
    const user = userEvent.setup();
    sidebar(["self.workload.containers.index"]);

    await user.click(menuButton());

    expect(shownInTheMenu()).toEqual([
      "/dashboard/containers",
      "/dashboard/images",
      "/dashboard/networks",
      "/dashboard/volumes",
    ]);
  });

  it("shows all of its pages, in order, to somebody who may see all of them", async () => {
    const user = userEvent.setup();
    sidebar(ALL_OF_THE_WORKLOAD);

    await user.click(menuButton());

    expect(shownInTheMenu()).toEqual(THE_WORKLOAD_PAGES);
  });

  it("holds nothing but the workload's pages", async () => {
    const user = userEvent.setup();
    sidebar([
      ...ALL_OF_THE_WORKLOAD,
      "users.index",
      "roles.index",
      "languages.index",
      "config.show",
    ]);

    await user.click(menuButton());

    expect(shownInTheMenu()).toEqual(THE_WORKLOAD_PAGES);
    for (const outside of [
      "dashboard.sidebar.users",
      "dashboard.sidebar.roles",
      "dashboard.sidebar.languages",
      "dashboard.sidebar.settings",
      "dashboard.sidebar.profile",
    ]) {
      expect(link(outside)).toBeInTheDocument();
      expect(shownInTheMenu()).not.toContain(
        link(outside)?.getAttribute("href"),
      );
    }
  });

  it("is closed on a page that is not one of its own", () => {
    sidebar(ALL_OF_THE_WORKLOAD, "/dashboard/users");

    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(link("dashboard.sidebar.vms")).not.toBeInTheDocument();
  });

  it("is open on one of its pages, with that page marked as the one being looked at", () => {
    sidebar(ALL_OF_THE_WORKLOAD, "/dashboard/snapshots");

    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    expect(link("dashboard.sidebar.snapshots")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(link("dashboard.sidebar.snapshots")).toHaveAttribute("data-active");
    expect(link("dashboard.sidebar.vms")).not.toHaveAttribute("aria-current");
    expect(link("dashboard.sidebar.vms")).not.toHaveAttribute("data-active");
  });

  it("is open on a page under one of its pages, with that page marked", () => {
    sidebar(ALL_OF_THE_WORKLOAD, "/dashboard/vms/abc");

    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    expect(link("dashboard.sidebar.vms")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens and closes when it is clicked", async () => {
    const user = userEvent.setup();
    sidebar(ALL_OF_THE_WORKLOAD);

    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(shownInTheMenu()).toEqual([]);

    await user.click(menuButton());

    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    expect(shownInTheMenu()).toEqual(THE_WORKLOAD_PAGES);

    await user.click(menuButton());

    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(shownInTheMenu()).toEqual([]);
  });

  it("opens and closes from the keyboard", async () => {
    const user = userEvent.setup();
    sidebar(ALL_OF_THE_WORKLOAD);

    await user.tab(); // the dashboard
    await user.tab();
    expect(menuButton()).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");

    await user.tab();
    expect(link("dashboard.sidebar.vms")).toHaveFocus();

    await user.tab({shift: true});
    await user.keyboard(" ");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(link("dashboard.sidebar.vms")).not.toBeInTheDocument();
  });

  it("opens when somebody comes to one of its pages from elsewhere, and is otherwise left as they put it", async () => {
    const user = userEvent.setup();
    const {goTo} = sidebar(ALL_OF_THE_WORKLOAD);

    expect(menuButton()).toHaveAttribute("aria-expanded", "false");

    goTo("/dashboard/vms");
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");

    await user.click(menuButton());
    goTo("/dashboard/vms/abc");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");

    goTo("/dashboard/profile");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");

    goTo("/dashboard/stacks");
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("says which pages it shows and hides, and they say what they are under", () => {
    sidebar(ALL_OF_THE_WORKLOAD, "/dashboard/vms");

    const menu = screen.getByRole("group", {name: WORKLOADS});

    expect(menuButton()).toHaveAttribute("aria-controls", menu.id);
    expect(menu).toContainElement(link("dashboard.sidebar.vms"));
  });
});
