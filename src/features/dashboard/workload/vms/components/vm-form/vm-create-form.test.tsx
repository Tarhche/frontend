import {render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {GiB, MiB} from "../../lib/units";
import {type SnapshotChoice, VmCreateForm} from "./vm-create-form";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

// the API is a server action away; what is checked is what it is sent.
const mockCreate = jest.fn();

jest.mock("../../actions/create-vm", () => ({
  createVm: (state: unknown, request: unknown) => mockCreate(state, request),
}));

beforeAll(() => {
  // what the segmented control and the selects measure themselves with.
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({});
});

const nightly: SnapshotChoice = {
  uuid: "snap-1",
  name: "nightly",
  kind: "docker",
  disk: 30 * GiB,
  image: "docker:29-dind",
  vm_name: "builds",
};

function form(props: Partial<React.ComponentProps<typeof VmCreateForm>> = {}) {
  return render(
    <MantineProvider env="test">
      <VmCreateForm snapshots={[]} {...props} />
    </MantineProvider>,
  );
}

function sent() {
  return mockCreate.mock.calls[mockCreate.mock.calls.length - 1][1];
}

describe("VmCreateForm", () => {
  it("says what is wrong before anything is sent", async () => {
    const user = userEvent.setup();
    form();

    await user.click(screen.getByRole("button", {name: "vms.form.create"}));

    expect(
      screen.getByText(/^vms\.form\.errors\.required/),
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sends its sizes as bytes and its network as allow and deny", async () => {
    const user = userEvent.setup();
    form();

    await user.type(
      screen.getByRole("textbox", {name: "vms.form.name"}),
      "web",
    );

    const memory = screen.getByRole("textbox", {name: "vms.form.memory"});
    await user.clear(memory);
    await user.type(memory, "512");
    await user.selectOptions(
      screen.getByRole("combobox", {name: "vms.form.memory"}),
      "MiB",
    );

    await user.click(screen.getByRole("switch", {name: /^vms\.form\.egress/}));
    await user.click(screen.getByRole("button", {name: "vms.form.create"}));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(sent()).toEqual({
      name: "web",
      kind: "machine",
      image: "ubuntu:24.04",
      resources: {cpus: 1, memory: 512 * MiB, disk: 10 * GiB},
      ports: [],
      network: {ingress: "allow", egress: "deny"},
      persistent_disk: true,
      lifetime_seconds: 0,
    });
  });

  it("takes a fraction of a GiB as it is typed", async () => {
    const user = userEvent.setup();
    form();

    await user.type(
      screen.getByRole("textbox", {name: "vms.form.name"}),
      "web",
    );

    const memory = screen.getByRole("textbox", {name: "vms.form.memory"});
    await user.clear(memory);
    await user.type(memory, "0.5");
    expect(memory).toHaveValue("0.5");

    await user.click(screen.getByRole("button", {name: "vms.form.create"}));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(sent().resources.memory).toBe(512 * MiB);
  });

  it("reads the number in whichever unit is picked for it", async () => {
    const user = userEvent.setup();
    form();

    await user.type(
      screen.getByRole("textbox", {name: "vms.form.name"}),
      "web",
    );

    // the disk starts at 10 GiB; picking MiB says the 10 was meant in MiB.
    await user.selectOptions(
      screen.getByRole("combobox", {name: "vms.form.disk"}),
      "MiB",
    );
    expect(screen.getByRole("textbox", {name: "vms.form.disk"})).toHaveValue(
      "10",
    );

    await user.click(screen.getByRole("button", {name: "vms.form.create"}));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(sent().resources.disk).toBe(10 * MiB);
  });

  it("warns that a Docker VM without egress cannot pull images", async () => {
    const user = userEvent.setup();
    form();

    await user.click(screen.getByLabelText("vms.kinds.docker"));

    // a Docker VM's image is the workload's to choose.
    expect(
      screen.queryByRole("textbox", {name: "vms.form.image"}),
    ).not.toBeInTheDocument();
    expect(screen.getByText("vms.form.dockerImage")).toBeInTheDocument();
    expect(
      screen.queryByText("vms.form.dockerWithoutEgress"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", {name: /^vms\.form\.egress/}));

    expect(
      screen.getByText("vms.form.dockerWithoutEgress"),
    ).toBeInTheDocument();
  });

  it("shows what the API refused beside the field it is about", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({
      problem: {
        status: 400,
        fields: {
          name: "already taken",
          "resources.memory": "more than a VM may have",
          vm: "you have reached your limit of VMs",
        },
        unanswered: false,
      },
    });
    form();

    await user.type(
      screen.getByRole("textbox", {name: "vms.form.name"}),
      "web",
    );
    await user.click(screen.getByRole("button", {name: "vms.form.create"}));

    expect(await screen.findByText("already taken")).toBeInTheDocument();
    expect(screen.getByText("more than a VM may have")).toBeInTheDocument();
    expect(
      within(screen.getByRole("alert")).getByText(
        "you have reached your limit of VMs",
      ),
    ).toBeInTheDocument();
  });

  it("restores a snapshot as a new VM, opened with it chosen", async () => {
    const user = userEvent.setup();
    form({snapshots: [nightly], snapshotUuid: "snap-1"});

    // the kind and the image are the snapshot's, and the disk is at least
    // its disk.
    expect(screen.getByLabelText("vms.kinds.docker")).toBeChecked();
    expect(screen.getByLabelText("vms.kinds.docker")).toBeDisabled();
    expect(screen.getByText("docker:29-dind")).toBeInTheDocument();
    expect(
      screen.getByText("vms.form.diskAtLeast(30 GiB)"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", {name: "vms.form.name"}),
      "builds-2",
    );
    await user.click(screen.getByRole("button", {name: "vms.form.restore"}));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(sent()).toMatchObject({
      name: "builds-2",
      kind: "docker",
      snapshot_uuid: "snap-1",
      resources: {cpus: 2, memory: 2 * GiB, disk: 30 * GiB},
    });
    expect(sent()).not.toHaveProperty("image");
  });
});
