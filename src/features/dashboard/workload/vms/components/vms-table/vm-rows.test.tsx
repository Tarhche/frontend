import {screen, within} from "@testing-library/react";
import {Table} from "@mantine/core";
import {renderWithProviders} from "@/features/dashboard/workload/docker/test-utils";
import {type Page, type Vm} from "../../types";
import {VmRows} from "./vm-rows";

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

jest.mock("../../actions/vm-commands", () => ({
  commandVm: jest.fn(),
  deleteVm: jest.fn(),
}));

const getVms = jest.fn();

jest.mock("../../client", () => ({
  getVms: (...args: unknown[]) => getVms(...args),
}));

const admin = [
  "workload.vms.index",
  "workload.vms.show",
  "workload.vms.delete",
  "workload.vms.manage",
];

function vm(overrides: Partial<Vm>): Vm {
  return {
    uuid: "vm-1",
    name: "box",
    slug: "box-ab12c",
    owner_uuid: "someone",
    kind: "machine",
    image: "ubuntu:24.04",
    state: "stopped",
    ports: [],
    network: {ingress: "allow", egress: "deny"},
    resources: {cpus: 1, memory: 1024 ** 3, disk: 10 * 1024 ** 3},
    persistent_disk: true,
    lifetime_seconds: 0,
    created_at: "2026-10-05T12:00:00Z",
    ...overrides,
  };
}

const page: Page<Vm> = {
  items: [
    vm({
      uuid: "run-1",
      name: "a-snippet",
      owner_uuid: "guest",
      owner: {uuid: "guest"},
      state: "running",
      lifetime_seconds: 60,
      managed_by: "code-runner",
    }),
    vm({uuid: "vm-1", name: "box", owner: {uuid: "someone", name: "Sam"}}),
  ],
  pagination: {total_pages: 1, current_page: 1},
};

function rows() {
  getVms.mockResolvedValue(page);

  return renderWithProviders(
    <Table>
      <VmRows
        scope="all"
        page={1}
        initial={page}
        permissions={admin}
        me="me"
        showOwner
      />
    </Table>,
  );
}

describe("VmRows", () => {
  it("lists a run of the code runner's as the guest's, said to be the code runner's", () => {
    rows();

    const [run, box] = screen.getAllByRole("row");

    expect(within(run).getByText("a-snippet")).toBeInTheDocument();
    expect(within(run).getByText("vms.codeRunner.badge")).toBeInTheDocument();
    expect(within(run).getByText("common.guestUser")).toBeInTheDocument();

    // it can be stopped and deleted, and nothing else.
    expect(
      within(run).getByRole("button", {name: "vms.actions.stop"}),
    ).toBeInTheDocument();
    expect(
      within(run).getByRole("button", {name: "vms.actions.delete"}),
    ).toBeInTheDocument();
    expect(
      within(run).queryByRole("button", {name: "vms.actions.start"}),
    ).not.toBeInTheDocument();
    expect(
      within(run).queryByRole("button", {name: "vms.actions.restart"}),
    ).not.toBeInTheDocument();

    // and a VM somebody asked for is nobody's but theirs.
    expect(
      within(box).queryByText("vms.codeRunner.badge"),
    ).not.toBeInTheDocument();
    expect(within(box).getByText("Sam")).toBeInTheDocument();
    expect(
      within(box).getByRole("button", {name: "vms.actions.start"}),
    ).toBeInTheDocument();
  });
});
