import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {GiB} from "@/features/dashboard/workload/vms/lib/units";
import {type Snapshot} from "../types";
import {SnapshotActions} from "./snapshot-actions";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const mockDelete = jest.fn();
const mockRename = jest.fn();

jest.mock("../actions/snapshot-commands", () => ({
  deleteSnapshot: (...args: unknown[]) => mockDelete(...args),
  renameSnapshot: (...args: unknown[]) => mockRename(...args),
}));

jest.mock("@/features/dashboard/workload/vms/actions/vm-commands", () => ({
  restoreVm: jest.fn(),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mockDelete.mockReset().mockResolvedValue({ok: true});
  mockRename.mockReset().mockResolvedValue({ok: true});
});

const nightly: Snapshot = {
  uuid: "snap-1",
  name: "nightly",
  owner_uuid: "me",
  vm_uuid: "vm-1",
  vm_name: "web",
  kind: "machine",
  image: "ubuntu:24.04",
  disk: 10 * GiB,
  size: 2 * GiB,
  state: "ready",
  created_at: "2026-10-04T10:00:00Z",
};

function actions(
  props: Partial<React.ComponentProps<typeof SnapshotActions>> = {},
) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

  return render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <SnapshotActions
          snapshot={nightly}
          rename="mine"
          remove="mine"
          {...props}
        />
      </MantineProvider>
    </QueryClientProvider>,
  );
}

describe("SnapshotActions", () => {
  it("restores a ready snapshot as a new VM through the create form", () => {
    actions({restoreAsNew: true});

    expect(
      screen.getByRole("link", {name: "snapshots.actions.restoreAsNew"}),
    ).toHaveAttribute("href", "/dashboard/vms/new?snapshot=snap-1");
  });

  it("offers nothing to restore from a snapshot that is not ready", () => {
    actions({
      snapshot: {...nightly, state: "creating"},
      restoreAsNew: true,
      restore: {scope: "mine", choose: {scope: "mine", me: "me"}},
    });

    expect(
      screen.queryByRole("link", {name: "snapshots.actions.restoreAsNew"}),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "snapshots.actions.restoreAsNew"}),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {name: "snapshots.actions.restoreOnto"}),
    ).toBeDisabled();
  });

  it("deletes one only once it is confirmed", async () => {
    const user = userEvent.setup();
    actions();

    await user.click(
      screen.getByRole("button", {name: "snapshots.actions.delete"}),
    );
    expect(
      screen.getByText("snapshots.actions.deleteConfirm(nightly)"),
    ).toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", {name: "common.delete"}));

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("snap-1", "mine"),
    );
  });

  it("renames one through the routes it was given", async () => {
    const user = userEvent.setup();
    actions({rename: "all"});

    await user.click(
      screen.getByRole("button", {name: "snapshots.actions.rename"}),
    );

    const name = screen.getByRole("textbox", {name: "snapshots.rename.name"});
    expect(name).toHaveValue("nightly");

    await user.clear(name);
    await user.type(name, "before upgrade");
    await user.click(
      screen.getByRole("button", {name: "snapshots.rename.submit"}),
    );

    await waitFor(() =>
      expect(mockRename).toHaveBeenCalledWith(
        "snap-1",
        "before upgrade",
        "all",
      ),
    );
  });

  it("offers only what the person may do", () => {
    actions({rename: null, remove: null});

    expect(
      screen.queryByRole("button", {name: "snapshots.actions.rename"}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "snapshots.actions.delete"}),
    ).not.toBeInTheDocument();
  });
});
