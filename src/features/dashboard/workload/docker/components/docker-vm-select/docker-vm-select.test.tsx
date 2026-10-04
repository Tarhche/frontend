import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {GiB} from "../../format";
import {dockerVm, renderWithProviders} from "../../test-utils";
import {type Vm, type VmSource} from "../../types";
import {vmTarget} from "./choice";
import {DockerVmSelect} from "./docker-vm-select";
import {useDockerVmChoice} from "./use-docker-vm-choice";

// the select asks for its words in the reader's language; which words it asks
// for is what this is about.
jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const fetchDockerVms = jest.fn();

jest.mock("../../api", () => ({
  fetchDockerVms: (...args: unknown[]) => fetchDockerVms(...args),
}));

/** The select as a create form uses it, with what it would send beside it. */
function Form({
  source,
  allowNew,
}: {
  source: VmSource | null;
  allowNew: boolean;
}) {
  const state = useDockerVmChoice(source, {allowNew});

  return (
    <>
      <DockerVmSelect state={state} />
      <output data-testid="target">
        {JSON.stringify(vmTarget(state.choice))}
      </output>
    </>
  );
}

function sent() {
  return JSON.parse(screen.getByTestId("target").textContent ?? "{}");
}

function listing(vms: Vm[]) {
  fetchDockerVms.mockResolvedValue(vms);
}

beforeEach(() => {
  fetchDockerVms.mockReset();
});

describe("DockerVmSelect, creating something", () => {
  it("says a Docker VM will be created for somebody who has none, with its defaults to change", async () => {
    listing([]);
    renderWithProviders(<Form source={{scope: "mine"}} allowNew />);

    expect(
      await screen.findByText("dockerVms.select.willBeCreated"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("dockerVms.new.name")).toHaveValue("docker");
    expect(
      screen.getByRole("switch", {name: /dockerVms.new.ingress/}),
    ).toBeChecked();
    expect(
      screen.getByRole("switch", {name: /dockerVms.new.egress/}),
    ).toBeChecked();

    expect(sent()).toEqual({
      vm: {
        name: "docker",
        resources: {cpus: 2, memory: 2 * GiB, disk: 20 * GiB},
        ports: [80, 443, 8080],
        network: {ingress: "allow", egress: "allow"},
      },
    });
  });

  it("sends the defaults as somebody changed them", async () => {
    const user = userEvent.setup();
    listing([]);
    renderWithProviders(<Form source={{scope: "mine"}} allowNew />);

    const name = await screen.findByLabelText("dockerVms.new.name");
    await user.clear(name);
    await user.type(name, "builds");

    const cpus = screen.getByLabelText("dockerVms.new.cpus");
    await user.clear(cpus);
    await user.type(cpus, "4");

    await user.click(
      screen.getByRole("switch", {name: /dockerVms.new.ingress/}),
    );

    expect(sent()).toMatchObject({
      vm: {
        name: "builds",
        resources: {cpus: 4},
        network: {ingress: "deny", egress: "allow"},
      },
    });
  });

  it("puts it in the only Docker VM there is, and says how that VM is", async () => {
    listing([dockerVm({uuid: "vm-1", name: "docker-one"})]);
    renderWithProviders(<Form source={{scope: "mine"}} allowNew />);

    await waitFor(() => expect(sent()).toEqual({vm_uuid: "vm-1"}));
    expect(
      screen.getByRole("combobox", {name: "dockerVms.select.label"}),
    ).toHaveValue("docker-one");

    // the state is shown in its own words when the dictionary has none, beside
    // the VM as well as in the list it was picked from.
    expect(
      screen.getByText("running", {ignore: '[role="option"] *'}),
    ).toBeInTheDocument();
    expect(
      screen.getByText("dockerVms.summary.resources(2,2 GiB,20 GiB)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("dockerVms.select.willBeCreated"),
    ).not.toBeInTheDocument();
  });

  it("leaves a pick out of several to the person, a new VM among them", async () => {
    const user = userEvent.setup();
    listing([
      dockerVm({uuid: "vm-1", name: "docker-one"}),
      dockerVm({uuid: "vm-2", name: "docker-two"}),
    ]);
    renderWithProviders(<Form source={{scope: "mine"}} allowNew />);

    expect(
      await screen.findByText("dockerVms.select.pickHelp"),
    ).toBeInTheDocument();

    const select = screen.getByRole("combobox", {
      name: "dockerVms.select.label",
    });
    expect(select).toHaveValue("");
    expect(sent()).toEqual({});

    await user.click(select);
    const options = await screen.findByRole("listbox");
    expect(
      within(options).getByText("dockerVms.select.newVm"),
    ).toBeInTheDocument();

    await user.click(within(options).getByText("docker-two"));
    expect(sent()).toEqual({vm_uuid: "vm-2"});

    await user.click(select);
    await user.click(await screen.findByText("dockerVms.select.newVm"));
    expect(sent()).toMatchObject({vm: {name: "docker"}});
    expect(screen.getByLabelText("dockerVms.new.name")).toBeInTheDocument();
  });

  it("explains that a VM which is not running has nothing in it to ask", async () => {
    listing([dockerVm({state: "stopped"})]);
    renderWithProviders(<Form source={{scope: "mine"}} allowNew />);

    expect(
      await screen.findByText("dockerVms.readiness.stopped"),
    ).toBeInTheDocument();
  });

  it("leaves the choice to the platform when the VMs may not be listed", () => {
    renderWithProviders(<Form source={null} allowNew />);

    expect(
      screen.getByText("dockerVms.select.chosenForYou"),
    ).toBeInTheDocument();
    expect(fetchDockerVms).not.toHaveBeenCalled();
    expect(sent()).toEqual({});
  });
});

describe("DockerVmSelect, looking into a VM", () => {
  it("offers no new VM, and says there is nothing to look into", async () => {
    listing([]);
    renderWithProviders(<Form source={{scope: "all"}} allowNew={false} />);

    expect(
      await screen.findByText("dockerVms.select.noneTitle"),
    ).toBeInTheDocument();
    expect(fetchDockerVms).toHaveBeenCalledWith("all");
  });
});
