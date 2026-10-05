import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {renderWithProviders} from "@/features/dashboard/workload/docker/test-utils";
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
}));

// what each tab holds is tested where it is written; what is asked here is
// which tabs there are.
jest.mock("./vm-terminal", () => ({VmTerminal: () => <div>a terminal</div>}));
jest.mock("./vm-settings-form", () => ({
  VmSettingsForm: () => <div>its settings</div>,
}));
jest.mock(
  "@/features/dashboard/workload/snapshots/components/vm-snapshots",
  () => ({VmSnapshots: () => <div>its snapshots</div>}),
);

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

beforeEach(() => {
  getVm.mockReset();
});

describe("VmDetail", () => {
  it("says a run is the code runner's, the guest's, and offers its overview and its log alone", async () => {
    getVm.mockResolvedValue(run());
    detail(run());

    expect(screen.getAllByText("vms.codeRunner.badge").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("vms.codeRunner.note")).toBeInTheDocument();
    expect(screen.getByText("common.guestUser")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.run")).toBeInTheDocument();

    expect(
      screen.getByRole("tab", {name: "vms.detail.overview"}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {name: "vms.detail.logs"}),
    ).toBeInTheDocument();
    for (const hidden of ["terminal", "snapshots", "settings"]) {
      expect(
        screen.queryByRole("tab", {name: `vms.detail.${hidden}`}),
      ).not.toBeInTheDocument();
    }

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
