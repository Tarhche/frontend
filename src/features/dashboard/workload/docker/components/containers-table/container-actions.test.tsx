import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {renderWithProviders} from "../../test-utils";
import {type Container} from "../../types";
import {ContainerActions} from "./container-actions";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const commandContainer = jest.fn();
const removeContainer = jest.fn();

jest.mock("../../api", () => ({
  commandContainer: (...args: unknown[]) => commandContainer(...args),
  removeContainer: (...args: unknown[]) => removeContainer(...args),
}));

function container(overrides: Partial<Container> = {}): Container {
  return {
    id: "c-1",
    name: "/web",
    image: "nginx",
    state: "running",
    status: "Up 3 minutes",
    ...overrides,
  };
}

const onRemoved = jest.fn();
const onPending = jest.fn();

type Routes = {manage: Scope | null; remove: Scope | null};

function actions(
  shown: Container,
  routes: Routes = {manage: "mine", remove: "mine"},
) {
  return renderWithProviders(
    <ContainerActions
      vmUuid="vm-1"
      container={shown}
      manage={routes.manage}
      remove={routes.remove}
      onRemoved={onRemoved}
      onPending={onPending}
    />,
  );
}

beforeEach(() => {
  commandContainer.mockReset().mockResolvedValue(undefined);
  removeContainer.mockReset().mockResolvedValue(undefined);
  onRemoved.mockReset();
  onPending.mockReset();
});

describe("ContainerActions", () => {
  it("starts a stopped container at once: there is nothing to interrupt", async () => {
    const user = userEvent.setup();
    actions(container({state: "exited", status: "Exited (0) 1 minute ago"}));

    await user.click(
      screen.getByRole("button", {name: "containers.actions.start"}),
    );

    await waitFor(() =>
      expect(commandContainer).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "c-1",
        "start",
      ),
    );
    expect(onPending).toHaveBeenCalledWith("starting");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before stopping one, and stops it only once agreed", async () => {
    const user = userEvent.setup();
    actions(container());

    await user.click(
      screen.getByRole("button", {name: "containers.actions.stop"}),
    );

    const question = await screen.findByRole("dialog");
    expect(
      within(question).getByText("containers.actions.stopConfirm(web)"),
    ).toBeInTheDocument();
    expect(commandContainer).not.toHaveBeenCalled();

    await user.click(
      within(question).getByRole("button", {name: "containers.actions.stop"}),
    );

    await waitFor(() =>
      expect(commandContainer).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "c-1",
        "stop",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("does nothing when the question is turned down", async () => {
    const user = userEvent.setup();
    actions(container());

    await user.click(
      screen.getByRole("button", {name: "containers.actions.restart"}),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "common.cancel",
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(commandContainer).not.toHaveBeenCalled();
  });

  it("removes a running container by force, and says so before anybody agrees", async () => {
    const user = userEvent.setup();
    actions(container({stack: "shop", service: "web"}));

    await user.click(
      screen.getByRole("button", {name: "containers.actions.remove"}),
    );

    const question = await screen.findByRole("dialog");
    expect(
      within(question).getByText("containers.actions.removeRunning"),
    ).toBeInTheDocument();
    expect(
      within(question).getByText("containers.actions.removeFromStack(shop)"),
    ).toBeInTheDocument();

    await user.click(
      within(question).getByRole("button", {
        name: "containers.actions.remove",
      }),
    );

    await waitFor(() =>
      expect(removeContainer).toHaveBeenCalledWith("mine", "vm-1", "c-1", true),
    );
    await waitFor(() => expect(onRemoved).toHaveBeenCalled());
  });

  it("removes a stopped one without force", async () => {
    const user = userEvent.setup();
    actions(container({state: "exited"}));

    await user.click(
      screen.getByRole("button", {name: "containers.actions.remove"}),
    );
    const question = await screen.findByRole("dialog");
    expect(
      within(question).queryByText("containers.actions.removeRunning"),
    ).not.toBeInTheDocument();

    await user.click(
      within(question).getByRole("button", {
        name: "containers.actions.remove",
      }),
    );

    await waitFor(() =>
      expect(removeContainer).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "c-1",
        false,
      ),
    );
  });

  it("keeps the question open with the refusal in it", async () => {
    const config = {headers: new AxiosHeaders()} as InternalAxiosRequestConfig;
    removeContainer.mockRejectedValue(
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
          // what dockerd itself refused comes back as the API says it.
          data: {
            errors: {
              docker: "Docker refused the request: removal already in progress",
            },
          },
        },
      ),
    );

    const user = userEvent.setup();
    actions(container({state: "exited"}));

    await user.click(
      screen.getByRole("button", {name: "containers.actions.remove"}),
    );
    const question = await screen.findByRole("dialog");
    await user.click(
      within(question).getByRole("button", {
        name: "containers.actions.remove",
      }),
    );

    expect(
      await within(question).findByText(
        "Docker refused the request: removal already in progress",
      ),
    ).toBeInTheDocument();
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it("asks through the routes it was given for each", async () => {
    const user = userEvent.setup();
    actions(container({state: "exited"}), {manage: "mine", remove: "all"});

    await user.click(
      screen.getByRole("button", {name: "containers.actions.start"}),
    );
    await waitFor(() =>
      expect(commandContainer).toHaveBeenCalledWith(
        "mine",
        "vm-1",
        "c-1",
        "start",
      ),
    );

    await user.click(
      screen.getByRole("button", {name: "containers.actions.remove"}),
    );
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "containers.actions.remove",
      }),
    );
    await waitFor(() =>
      expect(removeContainer).toHaveBeenCalledWith("all", "vm-1", "c-1", false),
    );
  });

  it("offers only what the person may do", () => {
    actions(container(), {manage: null, remove: "mine"});

    expect(
      screen.queryByRole("button", {name: "containers.actions.stop"}),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "containers.actions.remove"}),
    ).toBeInTheDocument();
  });
});
