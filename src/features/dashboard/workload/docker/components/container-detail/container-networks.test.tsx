import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {renderWithProviders} from "../../test-utils";
import {type Container} from "../../types";
import {ContainerNetworks} from "./container-networks";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const api = {
  fetchNetworks: jest.fn(),
  connectContainerNetwork: jest.fn(),
  disconnectContainerNetwork: jest.fn(),
};

jest.mock("../../api", () => ({
  fetchNetworks: (...args: unknown[]) => api.fetchNetworks(...args),
  connectContainerNetwork: (...args: unknown[]) =>
    api.connectContainerNetwork(...args),
  disconnectContainerNetwork: (...args: unknown[]) =>
    api.disconnectContainerNetwork(...args),
}));

const container: Container = {
  id: "c-1",
  name: "web",
  image: "nginx:1.27-alpine",
  state: "running",
  status: "Up 3 minutes",
  networks: ["backend"],
};

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
});

describe("ContainerNetworks", () => {
  it("offers a network listed twice once, as the VM lists the bridge network it replaced at boot until it is forgotten", async () => {
    api.fetchNetworks.mockResolvedValue([
      {id: "n-old", name: "bridge", driver: "bridge"},
      {id: "n-backend", name: "backend", driver: "bridge"},
      {id: "n-host", name: "host", driver: "host"},
      {id: "n-new", name: "bridge", driver: "bridge"},
    ]);

    const user = userEvent.setup();
    renderWithProviders(
      <ContainerNetworks
        vmUuid="vm-1"
        container={container}
        list="mine"
        manage="mine"
      />,
    );

    await screen.findByText("backend");
    await screen.findByPlaceholderText("containers.networks.pick");

    await user.click(
      screen.getByRole("combobox", {name: /containers.networks.network/}),
    );

    expect(screen.getAllByRole("option", {name: "bridge"})).toHaveLength(1);
    expect(
      screen.queryByRole("option", {name: "host"}),
    ).not.toBeInTheDocument();
  });
});
