import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {dockerVm, renderWithProviders} from "../../test-utils";
import {DockerObjectsPage, type DockerObjects} from "./docker-objects-page";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const api = {
  fetchDockerVms: jest.fn(),
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

jest.mock("../../api", () => ({
  fetchDockerVms: (...args: unknown[]) => api.fetchDockerVms(...args),
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

const may = {own: true, manage: true, delete: true, logs: true};

function page(objects: DockerObjects) {
  return renderWithProviders(
    <DockerObjectsPage
      objects={objects}
      scope="mine"
      may={may}
      vmSource={{scope: "mine"}}
    />,
  );
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());

  api.fetchDockerVms.mockResolvedValue([
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
});

describe("DockerObjectsPage", () => {
  it("says a VM that is not running has nothing to show, and asks it nothing", async () => {
    api.fetchDockerVms.mockResolvedValue([
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
    api.removeVolume.mockResolvedValue(undefined);
    const user = userEvent.setup();
    page("volumes");

    await user.click(
      await screen.findByRole("button", {
        name: "volumes.table.removeOne(data)",
      }),
    );
    const question = await screen.findByRole("dialog");
    expect(api.removeVolume).not.toHaveBeenCalled();

    await user.click(
      within(question).getByRole("button", {name: "volumes.table.remove"}),
    );

    await waitFor(() =>
      expect(api.removeVolume).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "data",
        false,
      ),
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
