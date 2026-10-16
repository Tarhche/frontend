import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {renderWithProviders} from "@/features/dashboard/workload/docker/test-utils";
import {type Snapshot} from "@/features/dashboard/workload/snapshots/types";
import {type Vm} from "../../types";
import {VmDetail} from "./vm-detail";

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
  usePathname: () => "/dashboard/vms/vm-1",
}));

jest.mock("../../actions/vm-commands", () => ({
  commandVm: jest.fn(),
  deleteVm: jest.fn(),
  restoreVm: jest.fn(),
}));

jest.mock(
  "@/features/dashboard/workload/snapshots/actions/snapshot-commands",
  () => ({
    takeSnapshot: jest.fn(),
    renameSnapshot: jest.fn(),
    deleteSnapshot: jest.fn(),
  }),
);

// the workload's ingress, which a terminal is opened on.
jest.mock("@/constants", () => ({
  ...jest.requireActual("@/constants"),
  PUBLIC_WORKLOAD_INGRESS_URL: "https://ingress.example",
}));

// a terminal says where it is opened, which is what is asked of it here: how
// it speaks to the shell is tested where it is written.
jest.mock("@/features/dashboard/workload/components/task-terminal", () => {
  const {attachURL} = jest.requireActual(
    "@/features/dashboard/workload/components/task-terminal/attach",
  );

  return {
    TaskTerminal: ({
      taskUuid,
      target,
    }: {
      taskUuid: string;
      target?: "tasks" | "vms";
    }) => <div>a terminal on {attachURL(taskUuid, target)}</div>,
  };
});

// what the settings hold is tested where they are written; what is asked
// here is whether there are any.
jest.mock("./vm-settings-form", () => ({
  VmSettingsForm: () => <div>its settings</div>,
}));

const getSnapshots = jest.fn();

jest.mock("@/features/dashboard/workload/snapshots/client", () => ({
  getSnapshots: (...args: unknown[]) => getSnapshots(...args),
}));

// the log, followed, says when it is not there any more, as a run's is not
// once its snippet has ended.
jest.mock("./vm-logs", () => ({
  VmLogs: ({onGone}: {onGone?: () => void}) => (
    <button type="button" onClick={() => onGone?.()}>
      the log is gone
    </button>
  ),
}));

const getVm = jest.fn();

jest.mock("../../client", () => ({
  getVm: (...args: unknown[]) => getVm(...args),
}));

// whoever may do anything with anybody's VMs, and with their own.
const admin = [
  "workload.vms.index",
  "workload.vms.show",
  "workload.vms.update",
  "workload.vms.delete",
  "workload.vms.manage",
  "workload.vms.logs",
  "workload.vms.attach",
  "workload.snapshots.index",
  "workload.snapshots.create",
  "self.workload.vms.show",
  "self.workload.vms.update",
  "self.workload.vms.delete",
  "self.workload.vms.manage",
  "self.workload.vms.logs",
  "self.workload.vms.attach",
  "self.workload.snapshots.index",
];

function machine(overrides: Partial<Vm> = {}): Vm {
  return {
    uuid: "vm-1",
    name: "box",
    slug: "box-ab12c",
    owner_uuid: "me",
    kind: "machine",
    image: "ubuntu:24.04",
    state: "running",
    expected_state: "running",
    ports: [],
    network: {ingress: "allow", egress: "deny"},
    resources: {cpus: 1, memory: 1024 ** 3, disk: 10 * 1024 ** 3},
    persistent_disk: true,
    lifetime_seconds: 0,
    created_at: "2026-10-05T12:00:00Z",
    ...overrides,
  };
}

/** a snippet the code runner is running, as the API shows it to an admin. */
function run(overrides: Partial<Vm> = {}): Vm {
  return machine({
    uuid: "run-1",
    name: "01a10ce9-28f7-756a-81f2-b565b129befd",
    owner_uuid: "guest",
    owner: {uuid: "guest"},
    image: "ghcr.io/tarhche/code-runner:nodejs-22.14-latest",
    resources: {cpus: 2, memory: 200 * 1024 ** 2, disk: 100 * 1024 ** 2},
    persistent_disk: false,
    lifetime_seconds: 60,
    expires_at: "2099-10-05T12:01:01Z",
    node_name: "workload-orchestrator-01",
    managed_by: "code-runner",
    ...overrides,
  });
}

function detail(initial: Vm) {
  return renderWithProviders(
    <VmDetail initial={initial} scope="all" permissions={admin} me="me" />,
  );
}

/** a snapshot the person looking took of a VM, ready. */
function snapshotOf(vm: Vm): Snapshot {
  return {
    uuid: `snap-of-${vm.uuid}`,
    name: "kept",
    owner_uuid: "me",
    vm_uuid: vm.uuid,
    vm_name: vm.name,
    kind: "machine",
    image: vm.image,
    disk: vm.resources.disk,
    size: 4 * 1024 ** 2,
    state: "ready",
    created_at: "2026-10-05T12:00:30Z",
  };
}

function snapshotsOf(vm: Vm) {
  getSnapshots.mockResolvedValue({
    items: [snapshotOf(vm)],
    pagination: {total_pages: 1, current_page: 1},
  });
}

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  getVm.mockReset();
  getSnapshots.mockReset().mockResolvedValue({
    items: [],
    pagination: {total_pages: 1, current_page: 1},
  });
});

describe("VmDetail", () => {
  it("says a run is the code runner's, the guest's, and offers every tab a VM has", async () => {
    getVm.mockResolvedValue(run());
    detail(run());

    expect(screen.getAllByText("vms.codeRunner.badge").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("vms.codeRunner.note")).toBeInTheDocument();
    expect(screen.getByText("common.guestUser")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.run")).toBeInTheDocument();

    for (const shown of [
      "overview",
      "terminal",
      "logs",
      "snapshots",
      "settings",
    ]) {
      expect(
        screen.getByRole("tab", {name: `vms.detail.${shown}`}),
      ).toBeInTheDocument();
    }
    expect(screen.getAllByRole("tab")).toHaveLength(5);

    expect(
      screen.getByRole("button", {name: "vms.actions.stop"}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "vms.actions.delete"}),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "vms.actions.start"}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "vms.actions.restart"}),
    ).not.toBeInTheDocument();
  });

  it("opens a run's terminal on its task, which is anybody's, rather than on a vm", async () => {
    const user = userEvent.setup();
    getVm.mockResolvedValue(run());
    detail(run());

    await user.click(screen.getByRole("tab", {name: "vms.detail.terminal"}));

    expect(
      screen.getByText(
        "a terminal on wss://ingress.example/tasks/run-1/attach",
      ),
    ).toBeInTheDocument();
  });

  it("takes a snapshot of a run as the person looking's, and never restores one onto it", async () => {
    const user = userEvent.setup();
    getVm.mockResolvedValue(run());
    snapshotsOf(run());
    detail(run());

    await user.click(screen.getByRole("tab", {name: "vms.detail.snapshots"}));

    const panel = screen.getByRole("tabpanel", {name: "vms.detail.snapshots"});
    expect(
      within(panel).getByRole("button", {name: "snapshots.actions.take"}),
    ).toBeInTheDocument();
    expect(await within(panel).findByText("kept")).toBeInTheDocument();
    expect(getSnapshots).toHaveBeenCalledWith("all", {vm: "run-1"});

    expect(
      within(panel).queryByLabelText("snapshots.actions.restoreOntoThis"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).queryByLabelText("snapshots.actions.restoreOnto"),
    ).not.toBeInTheDocument();
  });

  it("lists the snapshots somebody took of a run as theirs, when they may list only their own", async () => {
    const user = userEvent.setup();
    getVm.mockResolvedValue(run());
    snapshotsOf(run());
    renderWithProviders(
      <VmDetail
        initial={run()}
        scope="all"
        permissions={admin.filter((p) => p !== "workload.snapshots.index")}
        me="me"
      />,
    );

    await user.click(screen.getByRole("tab", {name: "vms.detail.snapshots"}));

    const panel = screen.getByRole("tabpanel", {name: "vms.detail.snapshots"});
    expect(await within(panel).findByText("kept")).toBeInTheDocument();
    expect(getSnapshots).toHaveBeenCalledWith("mine", {vm: "run-1"});
  });

  it("restores a snapshot onto a VM of the same owner", async () => {
    const user = userEvent.setup();
    getVm.mockResolvedValue(machine());
    snapshotsOf(machine());
    detail(machine());

    await user.click(screen.getByRole("tab", {name: "vms.detail.snapshots"}));

    const panel = screen.getByRole("tabpanel", {name: "vms.detail.snapshots"});
    expect(await within(panel).findByText("kept")).toBeInTheDocument();
    expect(
      within(panel).getAllByLabelText("snapshots.actions.restoreOntoThis")
        .length,
    ).toBeGreaterThan(0);
  });

  it("opens a VM's terminal on the vm", async () => {
    const user = userEvent.setup();
    getVm.mockResolvedValue(machine());
    detail(machine());

    await user.click(screen.getByRole("tab", {name: "vms.detail.terminal"}));

    expect(
      screen.getByText("a terminal on wss://ingress.example/vms/vm-1/attach"),
    ).toBeInTheDocument();
  });

  it("keeps every tab of a VM somebody asked for", () => {
    getVm.mockResolvedValue(machine());
    detail(machine());

    expect(screen.queryByText("vms.codeRunner.badge")).not.toBeInTheDocument();
    for (const shown of [
      "overview",
      "terminal",
      "logs",
      "snapshots",
      "settings",
    ]) {
      expect(
        screen.getByRole("tab", {name: `vms.detail.${shown}`}),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", {name: "vms.actions.restart"}),
    ).toBeInTheDocument();
  });

  it("says a run that has ended and gone has finished, rather than failing", async () => {
    const {client} = detail(run());

    // the run ends between two reads of it, and is gone from the next.
    getVm.mockResolvedValue(null);
    await act(() => client.refetchQueries());

    expect(
      await screen.findByText("vms.detail.runGoneTitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("vms.detail.runGone")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {name: "vms.detail.backToList"}),
    ).toBeInTheDocument();
    expect(screen.queryByText("vms.detail.goneTitle")).not.toBeInTheDocument();
  });

  it("reads a run again when its log is gone, and says the run has finished", async () => {
    const user = userEvent.setup();
    detail(run());

    // the run ends while its log is being followed: the log goes with it,
    // which is no failure to read it.
    getVm.mockResolvedValue(null);
    await user.click(screen.getByRole("tab", {name: "vms.detail.logs"}));
    await user.click(screen.getByText("the log is gone"));

    await waitFor(() => expect(getVm).toHaveBeenCalledWith("all", "run-1"));
    expect(
      await screen.findByText("vms.detail.runGoneTitle"),
    ).toBeInTheDocument();
  });

  it("says a VM somebody asked for that is gone is not found", async () => {
    const {client} = detail(machine());

    getVm.mockResolvedValue(null);
    await act(() => client.refetchQueries());

    expect(await screen.findByText("vms.detail.goneTitle")).toBeInTheDocument();
    expect(screen.getByText("vms.detail.gone")).toBeInTheDocument();
    expect(
      screen.queryByText("vms.detail.runGoneTitle"),
    ).not.toBeInTheDocument();
  });
});
