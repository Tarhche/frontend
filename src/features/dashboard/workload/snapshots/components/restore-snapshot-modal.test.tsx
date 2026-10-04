import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {GiB} from "@/features/dashboard/workload/vms/lib/units";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {RestoreSnapshotModal} from "./restore-snapshot-modal";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

// the API: the restore is a server action, and the VMs to restore onto are
// read from the browser.
const mockRestore = jest.fn();
const mockGetVms = jest.fn();
const mockNotify = jest.fn();

jest.mock("@/features/dashboard/workload/vms/actions/vm-commands", () => ({
  restoreVm: (...args: unknown[]) => mockRestore(...args),
}));

jest.mock("@/features/dashboard/workload/vms/client", () => ({
  getVms: (...args: unknown[]) => mockGetVms(...args),
}));

jest.mock("@mantine/notifications", () => ({
  notifications: {show: (...args: unknown[]) => mockNotify(...args)},
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  mockRestore.mockReset();
  mockGetVms.mockReset();
  mockNotify.mockReset();
  mockRestore.mockResolvedValue({ok: true});
});

const snapshot = {
  uuid: "snap-1",
  name: "nightly",
  kind: "machine" as const,
  disk: 10 * GiB,
};

function vm(values: Partial<Vm> & {uuid: string; name: string}): Vm {
  return {
    slug: `${values.name}-x`,
    owner_uuid: "me",
    kind: "machine",
    image: "ubuntu:24.04",
    resources: {cpus: 1, memory: GiB, disk: 20 * GiB},
    ports: [],
    network: {ingress: "allow", egress: "allow"},
    persistent_disk: true,
    lifetime_seconds: 0,
    state: "running",
    created_at: "2026-10-04T10:00:00Z",
    ...values,
  };
}

function modal(
  props: Partial<React.ComponentProps<typeof RestoreSnapshotModal>>,
) {
  const onClose = jest.fn();
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

  render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <RestoreSnapshotModal
          snapshot={snapshot}
          opened
          onClose={onClose}
          scope="mine"
          {...props}
        />
      </MantineProvider>
    </QueryClientProvider>,
  );

  return {onClose};
}

describe("restoring a snapshot onto this VM", () => {
  it("says the VM restarts and loses its disk before it is done", () => {
    modal({vm: vm({uuid: "vm-1", name: "web"})});

    expect(
      screen.getByText("snapshots.restore.confirm(nightly,web)"),
    ).toBeInTheDocument();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("restores it through the routes it was given, once confirmed", async () => {
    const user = userEvent.setup();
    const {onClose} = modal({vm: vm({uuid: "vm-1", name: "web"})});

    await user.click(
      screen.getByRole("button", {name: "snapshots.restore.submit"}),
    );

    await waitFor(() =>
      expect(mockRestore).toHaveBeenCalledWith("vm-1", "snap-1", "mine"),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({message: "snapshots.restore.started(web)"}),
    );
  });

  it("will not restore onto a disk smaller than the snapshot's", () => {
    modal({
      vm: vm({
        uuid: "vm-1",
        name: "web",
        resources: {cpus: 1, memory: GiB, disk: 5 * GiB},
      }),
    });

    expect(
      screen.getByText("snapshots.restore.unfit.disk(web)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "snapshots.restore.submit"}),
    ).toBeDisabled();
  });

  it("says what the API refused, and stays open", async () => {
    const user = userEvent.setup();
    mockRestore.mockResolvedValue({
      ok: false,
      errors: {snapshot_uuid: "taken by another engine"},
    });
    const {onClose} = modal({vm: vm({uuid: "vm-1", name: "web"})});

    await user.click(
      screen.getByRole("button", {name: "snapshots.restore.submit"}),
    );

    expect(
      await screen.findByText("taken by another engine"),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("restoring a snapshot onto a VM somebody chooses", () => {
  it("offers their own VMs of its kind, and only those that can take it", async () => {
    const user = userEvent.setup();
    mockGetVms.mockResolvedValue({
      items: [
        vm({uuid: "vm-web", name: "web"}),
        vm({
          uuid: "vm-tiny",
          name: "tiny",
          resources: {cpus: 1, memory: GiB, disk: GiB},
        }),
        vm({uuid: "vm-docker", name: "builds", kind: "docker"}),
      ],
      pagination: {total_pages: 1, current_page: 1},
    });
    modal({choose: {scope: "mine", me: "me"}});

    await waitFor(() =>
      expect(mockGetVms).toHaveBeenCalledWith("mine", {kind: "machine"}),
    );

    await user.click(
      await screen.findByRole("combobox", {name: "snapshots.restore.vm"}),
    );

    expect(screen.getByRole("option", {name: "web"})).toBeInTheDocument();
    expect(
      screen.getByRole("option", {name: "snapshots.restore.unfit.disk(tiny)"}),
    ).toHaveAttribute("data-combobox-disabled", "true");
    expect(
      screen.queryByRole("option", {name: /builds/}),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", {name: "web"}));
    expect(
      screen.getByText("snapshots.restore.confirm(nightly,web)"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {name: "snapshots.restore.submit"}),
    );

    await waitFor(() =>
      expect(mockRestore).toHaveBeenCalledWith("vm-web", "snap-1", "mine"),
    );
  });

  it("narrows the workload's listing to their own", async () => {
    const user = userEvent.setup();
    mockGetVms.mockResolvedValue({
      items: [
        vm({uuid: "vm-mine", name: "mine"}),
        vm({uuid: "vm-theirs", name: "theirs", owner_uuid: "somebody"}),
      ],
      pagination: {total_pages: 1, current_page: 1},
    });
    modal({choose: {scope: "all", me: "me"}});

    await user.click(
      await screen.findByRole("combobox", {name: "snapshots.restore.vm"}),
    );

    expect(screen.getByRole("option", {name: "mine"})).toBeInTheDocument();
    expect(
      screen.queryByRole("option", {name: "theirs"}),
    ).not.toBeInTheDocument();
  });

  it("says when there is nothing to restore onto", async () => {
    mockGetVms.mockResolvedValue({
      items: [],
      pagination: {total_pages: 0, current_page: 1},
    });
    modal({choose: {scope: "mine", me: "me"}});

    expect(
      await screen.findByText("snapshots.restore.noVms(vms.kinds.machine)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "snapshots.restore.submit"}),
    ).toBeDisabled();
  });
});
