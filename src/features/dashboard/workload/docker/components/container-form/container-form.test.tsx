import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {MiB} from "@/features/dashboard/workload/vms/lib/units";
import {ltr} from "../../format";
import {dockerVm, renderWithProviders} from "../../test-utils";
import {ContainerForm} from "./container-form";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({push, replace: jest.fn(), refresh: jest.fn()}),
  usePathname: () => "/dashboard/containers/new",
}));

const api = {
  getAllVms: jest.fn(),
  fetchImages: jest.fn(),
  fetchNetworks: jest.fn(),
  fetchVolumes: jest.fn(),
  createContainer: jest.fn(),
};

jest.mock("@/features/dashboard/workload/vms/client", () => ({
  getAllVms: (...args: unknown[]) => api.getAllVms(...args),
}));

jest.mock("../../api", () => ({
  fetchImages: (...args: unknown[]) => api.fetchImages(...args),
  fetchNetworks: (...args: unknown[]) => api.fetchNetworks(...args),
  fetchVolumes: (...args: unknown[]) => api.fetchVolumes(...args),
  createContainer: (...args: unknown[]) => api.createContainer(...args),
}));

const vm = dockerVm({uuid: "vm-1", name: "docker-one", ports: [80, 443]});

function form() {
  return renderWithProviders(
    <ContainerForm vmSource={{scope: "mine"}} listScope="mine" />,
  );
}

async function ready() {
  // the form is ready once it knows which VM it is for.
  await screen.findByText(/dockerVms\.summary\.ports\(\u2066?80, 443\u2069?\)/);
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  push.mockReset();

  api.getAllVms.mockResolvedValue([vm]);
  api.fetchImages.mockResolvedValue([
    {id: "sha256:1", tags: ["nginx:1.27-alpine"], size: 1},
  ]);
  api.fetchNetworks.mockResolvedValue([
    {id: "n1", name: "bridge", driver: "bridge"},
    {id: "n2", name: "host", driver: "host"},
    {id: "n3", name: "backend", driver: "bridge"},
  ]);
  api.fetchVolumes.mockResolvedValue([{name: "data"}]);
  api.createContainer.mockResolvedValue({
    vm: {uuid: "vm-1", name: "docker-one", created: false},
    container: {id: "c-1", name: "web", image: "nginx", state: "running"},
  });
});

describe("ContainerForm", () => {
  it("sends the environment, ports and mounts as the API reads them", async () => {
    const user = userEvent.setup();
    form();
    await ready();

    await user.type(
      screen.getByRole("combobox", {name: /containers.form.image/}),
      "nginx:1.27-alpine",
    );
    await user.type(
      screen.getByRole("textbox", {name: /containers.form.name/}),
      "web",
    );
    await user.type(
      screen.getByRole("textbox", {name: /containers.form.command/}),
      `sh -c "nginx -g 'daemon off;'"`,
    );

    await user.click(
      screen.getByRole("button", {name: "containers.form.env.add"}),
    );
    await user.type(
      screen.getByLabelText("containers.form.env.key(1)"),
      "MODE",
    );
    await user.type(
      screen.getByLabelText("containers.form.env.value(1)"),
      "production",
    );

    await user.click(
      screen.getByRole("button", {name: "containers.form.ports.add"}),
    );
    await user.type(
      screen.getByLabelText("containers.form.ports.container(1)"),
      "80",
    );

    await user.click(
      screen.getByRole("button", {name: "containers.form.mounts.add"}),
    );
    await user.type(
      screen.getByRole("combobox", {name: "containers.form.mounts.source(1)"}),
      "data",
    );
    await user.type(
      screen.getByLabelText("containers.form.mounts.target(1)"),
      "/usr/share/nginx/html",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "containers.form.mounts.readOnly(1)",
      }),
    );

    await user.type(
      screen.getByRole("textbox", {name: /containers.form.memory/}),
      "256",
    );

    await user.click(
      screen.getByRole("button", {name: "containers.form.create"}),
    );

    await waitFor(() => expect(api.createContainer).toHaveBeenCalled());
    expect(
      JSON.parse(JSON.stringify(api.createContainer.mock.calls[0][0])),
    ).toEqual({
      vm_uuid: "vm-1",
      name: "web",
      image: "nginx:1.27-alpine",
      command: ["sh", "-c", "nginx -g 'daemon off;'"],
      env: ["MODE=production"],
      ports: [{container_port: 80, host_port: 80, protocol: "tcp"}],
      mounts: [
        {
          type: "volume",
          source: "data",
          target: "/usr/share/nginx/html",
          read_only: true,
        },
      ],
      restart_policy: "unless-stopped",
      memory: 256 * MiB,
    });

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/containers/vm-1/c-1"),
    );
  });

  it("warns that a host port the VM does not expose is not reachable from outside", async () => {
    const user = userEvent.setup();
    form();
    await ready();

    await user.click(
      screen.getByRole("button", {name: "containers.form.ports.add"}),
    );
    const containerPort = screen.getByLabelText(
      "containers.form.ports.container(1)",
    );

    await user.type(containerPort, "3000");
    expect(
      screen.getByText(
        `containers.form.hint.unreachableOne(${ltr("3000")},${ltr("80, 443")})`,
      ),
    ).toBeInTheDocument();

    // published on a port the VM does expose, it is reachable after all.
    await user.type(
      screen.getByLabelText("containers.form.ports.host(1)"),
      "443",
    );
    expect(
      screen.queryByText(/containers.form.hint.unreachable/),
    ).not.toBeInTheDocument();
  });

  it("says what is wrong before sending anything", async () => {
    const user = userEvent.setup();
    form();
    await ready();

    await user.click(
      screen.getByRole("button", {name: "containers.form.create"}),
    );

    expect(
      screen.getByText("containers.form.errors.required"),
    ).toBeInTheDocument();
    expect(api.createContainer).not.toHaveBeenCalled();
  });

  it("waits for a pull for as long as it takes, and says what it is waiting for", async () => {
    let answer: (value: unknown) => void = () => {};
    api.createContainer.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const user = userEvent.setup();
    form();
    await ready();

    await user.type(
      screen.getByRole("combobox", {name: /containers.form.image/}),
      "postgres:17",
    );
    await user.click(
      screen.getByRole("button", {name: "containers.form.create"}),
    );

    expect(
      await screen.findByText("containers.form.waiting.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {name: /containers.form.image/}),
    ).toBeDisabled();

    await act(async () => {
      answer({
        vm: {uuid: "vm-1", name: "docker-one", created: false},
        container: {id: "c-2", name: "db", image: "postgres", state: "running"},
      });
    });

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/containers/vm-1/c-2"),
    );
  });

  it("does not call a pull nobody answered a failure: it may still be going", async () => {
    api.createContainer.mockRejectedValue(
      new AxiosError("Network Error", "ERR_NETWORK"),
    );

    const user = userEvent.setup();
    form();
    await ready();

    await user.type(
      screen.getByRole("combobox", {name: /containers.form.image/}),
      "postgres:17",
    );
    await user.click(
      screen.getByRole("button", {name: "containers.form.create"}),
    );

    expect(
      await screen.findByText("containers.form.unansweredTitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("docker.errors.unanswered")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {name: "containers.form.seeContainers"}),
    ).toHaveAttribute("href", "/dashboard/containers");
  });

  it("says each refusal beside what it is about, and lists the rest", async () => {
    const config = {headers: new AxiosHeaders()} as InternalAxiosRequestConfig;
    api.createContainer.mockRejectedValue(
      new AxiosError(
        "refused",
        undefined,
        config,
        {},
        {
          status: 400,
          statusText: "",
          headers: {},
          config,
          data: {
            errors: {
              "container.ports.0": "port 8080 is already published",
              "container.image": "no such image",
              "labels.owner": "is reserved",
            },
          },
        },
      ),
    );

    const user = userEvent.setup();
    form();
    await ready();

    await user.type(
      screen.getByRole("combobox", {name: /containers.form.image/}),
      "nginx",
    );
    await user.click(
      screen.getByRole("button", {name: "containers.form.ports.add"}),
    );
    await user.type(
      screen.getByLabelText("containers.form.ports.container(1)"),
      "8080",
    );
    await user.click(
      screen.getByRole("button", {name: "containers.form.create"}),
    );

    expect(
      await screen.findByText("port 8080 is already published"),
    ).toBeInTheDocument();
    expect(screen.getByText("no such image")).toBeInTheDocument();

    // what has no field of its own is still said, with what it was about.
    expect(screen.getByText("labels.owner")).toBeInTheDocument();
    expect(screen.getByText(/is reserved/)).toBeInTheDocument();
  });
});
