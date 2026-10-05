import {screen} from "@testing-library/react";
import {
  dockerVm,
  renderWithProviders,
} from "@/features/dashboard/workload/docker/test-utils";
import {containersOf, countContainers} from "../stacks-table/stacks-table";
import {StackDetail} from "./stack-detail";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

// an avatar is drawn by a module jest does not read; who is shown is the
// point, not how.
jest.mock("@/components/user-avatar", () => ({UserAvatar: () => null}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({push: jest.fn(), replace: jest.fn(), refresh: jest.fn()}),
  usePathname: () => "/dashboard/stacks/s-1",
}));

jest.mock("../compose-editor", () => ({
  ComposeEditor: ({value}: {value: string}) => <pre>{value}</pre>,
}));

const fetchStack = jest.fn();
const getAllVms = jest.fn();

jest.mock("../../api", () => ({
  fetchStack: (...args: unknown[]) => fetchStack(...args),
}));

jest.mock("@/features/dashboard/workload/vms/client", () => ({
  getAllVms: (...args: unknown[]) => getAllVms(...args),
}));

// what somebody who may do anything with their own stacks holds.
const permissions = [
  "self.workload.stacks.show",
  "self.workload.stacks.manage",
  "self.workload.stacks.delete",
];

function detail() {
  return renderWithProviders(
    <StackDetail
      scope="mine"
      uuid="s-1"
      permissions={permissions}
      me="me"
      vmSource={{scope: "mine"}}
    />,
  );
}

beforeEach(() => {
  fetchStack.mockReset();
  getAllVms.mockReset();
  getAllVms.mockResolvedValue([dockerVm({uuid: "vm-1", name: "docker-one"})]);
});

describe("StackDetail", () => {
  it("says why a stack failed, with what compose said open beneath it", async () => {
    fetchStack.mockResolvedValue({
      uuid: "s-1",
      name: "shop",
      slug: "shop-x1y2z",
      vm_uuid: "vm-1",
      state: "failed",
      reason: "compose up failed",
      output: "Error: pull access denied for privat/image",
      compose: "services: {}",
      created_at: "2026-10-04T12:00:00Z",
      containers: [],
    });
    detail();

    expect(await screen.findByText("compose up failed")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "stacks.detail.hide"}),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Error: pull access denied for privat/image"),
    ).toBeVisible();
  });

  it("links each container to its own page, in the stack's VM", async () => {
    fetchStack.mockResolvedValue({
      uuid: "s-1",
      name: "shop",
      slug: "shop-x1y2z",
      vm_uuid: "vm-1",
      state: "running",
      created_at: "2026-10-04T12:00:00Z",
      containers: [
        {
          id: "c-1",
          name: "/shop-x1y2z-web-1",
          image: "nginx",
          state: "running",
          status: "Up 2 minutes",
          stack: "shop-x1y2z",
          service: "web",
        },
      ],
    });
    detail();

    expect(
      await screen.findByRole("link", {name: "shop-x1y2z-web-1"}),
    ).toHaveAttribute("href", "/dashboard/containers/vm-1/c-1");
    expect(screen.getByText("web")).toBeInTheDocument();
  });

  it("does not pass a VM that is not running for a stack with no containers", async () => {
    fetchStack.mockResolvedValue({
      uuid: "s-1",
      name: "shop",
      slug: "shop-x1y2z",
      vm_uuid: "vm-1",
      state: "running",
      created_at: "2026-10-04T12:00:00Z",
      containers: [],
      note: "vm_not_running",
    });
    detail();

    expect(
      await screen.findByText("stacks.detail.vmNotRunningTitle"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("stacks.detail.noContainers"),
    ).not.toBeInTheDocument();
  });

  it("says a stack that is not there is not there", async () => {
    fetchStack.mockRejectedValue(
      Object.assign(new Error("Not Found"), {
        isAxiosError: true,
        response: {status: 404, data: ""},
      }),
    );
    detail();

    expect(
      await screen.findByText("stacks.detail.goneTitle"),
    ).toBeInTheDocument();
  });
});

describe("StackDetail, read as anybody's", () => {
  const theirs = {
    uuid: "s-9",
    name: "blog",
    slug: "blog-a1b2c",
    owner_uuid: "somebody",
    owner: {uuid: "somebody", name: "Sam"},
    vm_uuid: "vm-9",
    state: "running",
    created_at: "2026-10-04T12:00:00Z",
    containers: [],
  };

  function everybodys(held: string[]) {
    return renderWithProviders(
      <StackDetail
        scope="all"
        uuid="s-9"
        permissions={held}
        me="me"
        vmSource={{scope: "all"}}
      />,
    );
  }

  it("says whose it is, and offers nothing on the strength of one's own", async () => {
    fetchStack.mockResolvedValue(theirs);
    everybodys(["workload.stacks.show", "self.workload.stacks.manage"]);

    expect(await screen.findByText("Sam")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "stacks.actions.stop"}),
    ).not.toBeInTheDocument();
  });

  it("offers what the workload's permissions allow over anybody's", async () => {
    fetchStack.mockResolvedValue(theirs);
    everybodys(["workload.stacks.show", "workload.stacks.manage"]);

    expect(
      await screen.findByRole("button", {name: "stacks.actions.stop"}),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "stacks.actions.delete"}),
    ).not.toBeInTheDocument();
  });
});

describe("counting a stack's containers", () => {
  it("counts them by the stack the API says deployed them, or by VM and slug", () => {
    const counts = countContainers([
      {
        id: "1",
        name: "a",
        image: "x",
        state: "running",
        status: "",
        stack: "shop",
        stack_uuid: "s-1",
        vm_uuid: "vm-1",
      },
      {
        id: "2",
        name: "b",
        image: "x",
        state: "exited",
        status: "",
        stack: "shop",
        stack_uuid: "s-1",
        vm_uuid: "vm-1",
      },
      // a container the API could not link is still counted, by where it is.
      {
        id: "3",
        name: "c",
        image: "x",
        state: "running",
        status: "",
        stack: "shop",
        vm_uuid: "vm-2",
      },
      {id: "4", name: "d", image: "x", state: "running", status: ""},
    ]);

    expect(
      containersOf(counts, {uuid: "s-1", vm_uuid: "vm-1", slug: "shop"}),
    ).toBe(2);
    expect(
      containersOf(counts, {uuid: "s-2", vm_uuid: "vm-2", slug: "shop"}),
    ).toBe(1);
    expect(
      containersOf(counts, {uuid: "s-3", vm_uuid: "vm-3", slug: "blog"}),
    ).toBe(0);
  });
});
