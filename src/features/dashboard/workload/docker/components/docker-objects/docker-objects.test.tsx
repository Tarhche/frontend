import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {dockerVm, renderWithProviders} from "../../test-utils";
import {DockerObjectsPage, type DockerObjects} from "./docker-objects-page";

// an avatar is drawn by a module jest does not read; who is shown is the
// point, not how.
jest.mock("@/components/user-avatar", () => ({UserAvatar: () => null}));

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const mockNotify = jest.fn();

jest.mock("@mantine/notifications", () => ({
  notifications: {show: (...args: unknown[]) => mockNotify(...args)},
}));

const nothingNeedsIt = {dependents: [], recreated: false};

const config = {headers: new AxiosHeaders()} as InternalAxiosRequestConfig;

/** A request the API refused, with this body. */
function refused(data: unknown) {
  return new AxiosError(
    "refused",
    undefined,
    config,
    {},
    {status: 400, statusText: "", headers: {}, config, data},
  );
}

const api = {
  getAllVms: jest.fn(),
  fetchImages: jest.fn(),
  pullImage: jest.fn(),
  removeImage: jest.fn(),
  fetchNetworks: jest.fn(),
  createNetwork: jest.fn(),
  removeNetwork: jest.fn(),
  fetchVolumes: jest.fn(),
  createVolume: jest.fn(),
  removeVolume: jest.fn(),
};

jest.mock("@/features/dashboard/workload/vms/client", () => ({
  getAllVms: (...args: unknown[]) => api.getAllVms(...args),
}));

jest.mock("../../api", () => ({
  fetchImages: (...args: unknown[]) => api.fetchImages(...args),
  pullImage: (...args: unknown[]) => api.pullImage(...args),
  removeImage: (...args: unknown[]) => api.removeImage(...args),
  fetchNetworks: (...args: unknown[]) => api.fetchNetworks(...args),
  createNetwork: (...args: unknown[]) => api.createNetwork(...args),
  removeNetwork: (...args: unknown[]) => api.removeNetwork(...args),
  fetchVolumes: (...args: unknown[]) => api.fetchVolumes(...args),
  createVolume: (...args: unknown[]) => api.createVolume(...args),
  removeVolume: (...args: unknown[]) => api.removeVolume(...args),
}));

// what somebody who may do anything with their own holds.
const permissions = [
  "self.workload.containers.index",
  "self.workload.containers.show",
  "self.workload.containers.manage",
  "self.workload.containers.delete",
  "self.workload.containers.logs",
];

function page(objects: DockerObjects) {
  return renderWithProviders(
    <DockerObjectsPage
      objects={objects}
      scope="mine"
      permissions={permissions}
      me="me"
      vmSource={{scope: "mine"}}
    />,
  );
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
  mockNotify.mockReset();

  api.getAllVms.mockResolvedValue([
    dockerVm({uuid: "vm-1", name: "docker-one"}),
  ]);
  api.fetchImages.mockResolvedValue([
    {
      id: "sha256:aaaaaaaaaaaaaaaa",
      tags: ["nginx:1.27-alpine"],
      size: 50 * 1024 * 1024,
      in_use: true,
    },
  ]);
  api.fetchNetworks.mockResolvedValue([
    {id: "n1", name: "bridge", driver: "bridge"},
    {id: "n2", name: "backend", driver: "bridge", containers: ["web"]},
  ]);
  api.fetchVolumes.mockResolvedValue([{name: "data", driver: "local"}]);
  api.removeNetwork.mockResolvedValue(nothingNeedsIt);
  api.removeVolume.mockResolvedValue(nothingNeedsIt);
});

/** Asks to remove something, and waits until what needs it is known. */
async function askToRemove(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  confirmLabel: string,
) {
  await user.click(await screen.findByRole("button", {name}));
  const question = await screen.findByRole("dialog");
  const confirm = within(question).getByRole("button", {name: confirmLabel});
  await waitFor(() => expect(confirm).toBeEnabled());

  return {question, confirm};
}

describe("DockerObjectsPage", () => {
  it("says a VM that is not running has nothing to show, and asks it nothing", async () => {
    api.getAllVms.mockResolvedValue([
      dockerVm({uuid: "vm-1", name: "docker-one", state: "stopped"}),
    ]);
    page("images");

    expect(
      await screen.findByText("dockerVms.empty.stopped(docker-one)"),
    ).toBeInTheDocument();
    expect(api.fetchImages).not.toHaveBeenCalled();
  });

  it("pulls an image, waiting on it for as long as it takes", async () => {
    let pulled: (value: unknown) => void = () => {};
    api.pullImage.mockReturnValue(
      new Promise((resolve) => {
        pulled = resolve;
      }),
    );

    const user = userEvent.setup();
    page("images");

    await user.type(
      await screen.findByRole("textbox", {name: /images.pull.reference/}),
      "postgres:17",
    );
    await user.click(screen.getByRole("button", {name: "images.pull.submit"}));

    expect(
      await screen.findByText("images.pull.waiting(postgres:17)"),
    ).toBeInTheDocument();
    expect(api.pullImage).toHaveBeenCalledWith("mine", "vm-1", "postgres:17");

    await act(async () => {
      pulled({id: "sha256:b", tags: ["postgres:17"], size: 1});
    });

    // what the VM holds is asked for again once the pull is done.
    await waitFor(() => expect(api.fetchImages).toHaveBeenCalledTimes(2));
  });

  it("removes an image by force only when that is asked for", async () => {
    api.removeImage.mockResolvedValue(undefined);
    const user = userEvent.setup();
    page("images");

    await user.click(
      await screen.findByRole("button", {
        name: "images.table.removeOne(nginx:1.27-alpine)",
      }),
    );

    const question = await screen.findByRole("dialog");
    expect(
      within(question).getByText("images.table.removeInUse"),
    ).toBeInTheDocument();

    await user.click(
      within(question).getByRole("checkbox", {name: /images.table.force/}),
    );
    await user.click(
      within(question).getByRole("button", {name: "images.table.remove"}),
    );

    await waitFor(() =>
      expect(api.removeImage).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "sha256:aaaaaaaaaaaaaaaa",
        true,
      ),
    );
  });

  it("creates an internal bridge network", async () => {
    api.createNetwork.mockResolvedValue({id: "n3", name: "private"});
    const user = userEvent.setup();
    page("networks");

    await user.type(
      await screen.findByRole("textbox", {name: /networks.form.name/}),
      "private",
    );
    await user.click(
      screen.getByRole("switch", {name: /networks.form.internal/}),
    );
    await user.click(
      screen.getByRole("button", {name: "networks.form.create"}),
    );

    await waitFor(() =>
      expect(api.createNetwork).toHaveBeenCalledWith("mine", "vm-1", {
        name: "private",
        driver: "bridge",
        internal: true,
      }),
    );
  });

  it("does not offer to remove the networks docker keeps for itself", async () => {
    page("networks");

    expect(
      await screen.findByRole("button", {
        name: "networks.table.removeOne(backend)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "networks.table.removeOne(bridge)"}),
    ).not.toBeInTheDocument();
  });

  it("removes a volume, without force unless asked, once agreed", async () => {
    const user = userEvent.setup();
    page("volumes");

    const {question, confirm} = await askToRemove(
      user,
      "volumes.table.removeOne(data)",
      "volumes.table.remove",
    );

    // what needs it was asked, and nothing was removed.
    expect(api.removeVolume).toHaveBeenCalledTimes(1);
    expect(api.removeVolume).toHaveBeenCalledWith(
      "mine",
      "vm-1",
      "data",
      false,
      {
        dryRun: true,
      },
    );
    expect(within(question).queryByRole("radio")).not.toBeInTheDocument();

    await user.click(confirm);

    await waitFor(() =>
      expect(api.removeVolume).toHaveBeenLastCalledWith(
        "mine",
        "vm-1",
        "data",
        false,
        {cascade: false},
      ),
    );
  });

  it("asks again what needs a volume once force is ticked, and removes it by force", async () => {
    const user = userEvent.setup();
    page("volumes");

    const {question, confirm} = await askToRemove(
      user,
      "volumes.table.removeOne(data)",
      "volumes.table.remove",
    );
    await user.click(
      within(question).getByRole("checkbox", {name: /volumes.table.force/}),
    );

    await waitFor(() =>
      expect(api.removeVolume).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "data",
        true,
        {
          dryRun: true,
        },
      ),
    );
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);

    await waitFor(() =>
      expect(api.removeVolume).toHaveBeenLastCalledWith(
        "mine",
        "vm-1",
        "data",
        true,
        {cascade: false},
      ),
    );
  });

  it("says a volume removed alone comes back, and what brings it back", async () => {
    const shop = {kind: "stack", uuid: "s-1", name: "shop", recreates: true};
    api.removeVolume.mockResolvedValue({dependents: [shop], recreated: true});
    const user = userEvent.setup();
    page("volumes");

    const {question, confirm} = await askToRemove(
      user,
      "volumes.table.removeOne(data)",
      "volumes.table.remove",
    );
    expect(
      within(question).getByRole("radio", {
        name: "workload.dependents.alone.volume",
      }),
    ).toBeChecked();
    // whoever is looking may not look at stacks: it is named, not linked.
    expect(
      within(question).queryByRole("link", {name: "shop"}),
    ).not.toBeInTheDocument();
    expect(within(question).getByText("shop")).toBeInTheDocument();

    await user.click(confirm);

    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "workload.dependents.comesBack(data)",
          message:
            "workload.dependents.stack.recreates(workload.dependents.what.volume,shop)",
        }),
      ),
    );
  });

  it("removes a network together with what needs it, where alone it would be refused", async () => {
    api.removeNetwork.mockImplementation(async (_scope, _vm, _id, options) => {
      if (options?.cascade) {
        return {
          dependents: [
            {kind: "container", uuid: "c-1", name: "web", recreates: false},
          ],
          recreated: false,
        };
      }

      throw refused({
        errors: {docker: "Docker refused the request: network in use"},
        dependents: [
          {kind: "container", uuid: "c-1", name: "web", recreates: false},
        ],
        recreated: false,
      });
    });
    const user = userEvent.setup();
    page("networks");

    const {question, confirm} = await askToRemove(
      user,
      "networks.table.removeOne(backend)",
      "networks.table.remove",
    );

    expect(api.removeNetwork).toHaveBeenCalledWith("mine", "vm-1", "n2", {
      dryRun: true,
    });
    expect(
      within(question).getByText("workload.dependents.refused"),
    ).toBeInTheDocument();
    expect(
      within(question).getByText("Docker refused the request: network in use"),
    ).toBeInTheDocument();
    expect(within(question).getAllByRole("listitem")).toHaveLength(1);
    expect(within(question).getByRole("link", {name: "web"})).toHaveAttribute(
      "href",
      "/dashboard/containers/vm-1/c-1",
    );

    await user.click(
      within(question).getByRole("radio", {
        name: "workload.dependents.together.network",
      }),
    );
    await user.click(confirm);

    await waitFor(() =>
      expect(api.removeNetwork).toHaveBeenLastCalledWith("mine", "vm-1", "n2", {
        cascade: true,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(mockNotify).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: "workload.dependents.comesBack(backend)",
      }),
    );
  });

  it("asks for a name before creating a volume", async () => {
    const user = userEvent.setup();
    page("volumes");

    await user.click(
      await screen.findByRole("button", {name: "volumes.form.create"}),
    );

    expect(screen.getByText("volumes.form.required")).toBeInTheDocument();
    expect(api.createVolume).not.toHaveBeenCalled();
  });
});
