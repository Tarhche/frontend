import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {GiB} from "../../lib/units";
import {type Vm} from "../../types";
import {VmSettingsForm} from "./vm-settings-form";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const mockUpdate = jest.fn();

jest.mock("../../actions/update-vm", () => ({
  updateVm: (...args: unknown[]) => mockUpdate(...args),
}));

jest.mock("@mantine/notifications", () => ({
  notifications: {show: jest.fn()},
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mockUpdate.mockReset().mockResolvedValue({ok: true});
});

const web: Vm = {
  uuid: "vm-1",
  name: "web",
  slug: "web-a1b2c",
  owner_uuid: "me",
  kind: "machine",
  image: "ubuntu:24.04",
  resources: {cpus: 2, memory: 2 * GiB, disk: 20 * GiB},
  ports: [80],
  network: {ingress: "allow", egress: "allow"},
  persistent_disk: true,
  lifetime_seconds: 0,
  state: "running",
  created_at: "2026-10-04T10:00:00Z",
};

function settings(vm: Vm) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  const view = (current: Vm) => (
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <VmSettingsForm vm={current} scope="mine" />
      </MantineProvider>
    </QueryClientProvider>
  );

  const {rerender} = render(view(vm));

  return {rerender: (next: Vm) => rerender(view(next))};
}

const name = () => screen.getByRole("textbox", {name: "vms.form.name"});
const save = () => screen.getByRole("button", {name: /^vms\.settings\.save/});

describe("VmSettingsForm", () => {
  it("has nothing to save until something is changed", () => {
    settings(web);

    expect(save()).toBeDisabled();
  });

  it("sends only what was changed, through the routes it was given", async () => {
    const user = userEvent.setup();
    settings(web);

    await user.clear(name());
    await user.type(name(), "web-2");
    await user.click(save());

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("vm-1", "mine", {name: "web-2"}),
    );
  });

  it("says saving restarts a running VM when its ports change", async () => {
    const user = userEvent.setup();
    settings(web);

    expect(
      screen.queryByText("vms.settings.restartTitle"),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByRole("combobox", {name: "vms.form.ports"}),
      "8080,",
    );

    expect(screen.getByText("vms.settings.restartTitle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "vms.settings.saveAndRestart"}),
    ).toBeEnabled();
  });

  it("will not shrink the disk", async () => {
    const user = userEvent.setup();
    settings(web);

    const disk = screen.getByRole("textbox", {name: "vms.form.disk"});
    await user.clear(disk);
    await user.type(disk, "10");
    await user.click(save());

    expect(
      screen.getByText("vms.form.errors.diskMin(20 GiB)"),
    ).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("follows the VM as it is read again, until somebody changes something", async () => {
    const user = userEvent.setup();
    const {rerender} = settings(web);

    rerender({...web, name: "renamed-elsewhere"});
    expect(name()).toHaveValue("renamed-elsewhere");

    await user.clear(name());
    await user.type(name(), "mine");

    rerender({...web, name: "renamed-again"});
    expect(name()).toHaveValue("mine");
  });

  it("shows what the API refused beside the field", async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue({
      ok: false,
      problem: {
        status: 400,
        fields: {"resources.cpus": "more than a VM may have"},
        unanswered: false,
      },
    });
    settings(web);

    const cpus = screen.getByRole("textbox", {name: "vms.form.cpus"});
    await user.clear(cpus);
    await user.type(cpus, "64");
    await user.click(
      screen.getByRole("button", {name: /^vms\.settings\.save/}),
    );

    expect(
      await screen.findByText("more than a VM may have"),
    ).toBeInTheDocument();
  });
});
