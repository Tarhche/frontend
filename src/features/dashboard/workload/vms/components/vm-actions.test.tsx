import {render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {VmActions} from "./vm-actions";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const mockCommand = jest.fn();
const mockDelete = jest.fn();
const mockNotify = jest.fn();

jest.mock("../actions/vm-commands", () => ({
  commandVm: (...args: unknown[]) => mockCommand(...args),
  deleteVm: (...args: unknown[]) => mockDelete(...args),
}));

jest.mock("@mantine/notifications", () => ({
  notifications: {show: (...args: unknown[]) => mockNotify(...args)},
}));

const refused = {
  ok: false,
  problem: {
    status: 400,
    fields: {vm: "The VM is being restored."},
    unanswered: false,
  },
};

beforeEach(() => {
  mockCommand.mockReset().mockResolvedValue({ok: true});
  mockDelete.mockReset().mockResolvedValue({ok: true});
  mockNotify.mockReset();
});

function actions(state: "running" | "stopped" = "running") {
  const onDeleted = jest.fn();
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

  render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <VmActions
          vm={{uuid: "vm-1", name: "web", state}}
          manage="mine"
          remove="mine"
          onDeleted={onDeleted}
        />
      </MantineProvider>
    </QueryClientProvider>,
  );

  return {onDeleted};
}

describe("VmActions", () => {
  it("starts a stopped VM at once, and says so when it could not", async () => {
    const user = userEvent.setup();
    mockCommand.mockResolvedValue(refused);
    actions("stopped");

    await user.click(screen.getByRole("button", {name: "vms.actions.start"}));

    await waitFor(() =>
      expect(mockCommand).toHaveBeenCalledWith("start", "vm-1", "mine"),
    );
    await waitFor(() =>
      expect(mockNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "workload.errors.startFailed(web)",
          message: "The VM is being restored.",
        }),
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before stopping one, and closes the question once it is done", async () => {
    const user = userEvent.setup();
    actions();

    await user.click(screen.getByRole("button", {name: "vms.actions.stop"}));
    const question = await screen.findByRole("dialog");
    expect(mockCommand).not.toHaveBeenCalled();

    await user.click(
      within(question).getByRole("button", {name: "vms.actions.stop"}),
    );

    await waitFor(() =>
      expect(mockCommand).toHaveBeenCalledWith("stop", "vm-1", "mine"),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps the question open with the refusal in it", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValue(refused);
    const {onDeleted} = actions();

    await user.click(screen.getByRole("button", {name: "vms.actions.delete"}));
    const question = await screen.findByRole("dialog");
    await user.click(
      within(question).getByRole("button", {name: "vms.actions.delete"}),
    );

    expect(
      await within(question).findByText("The VM is being restored."),
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
