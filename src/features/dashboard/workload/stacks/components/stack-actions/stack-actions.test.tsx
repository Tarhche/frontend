import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {renderWithProviders} from "@/features/dashboard/workload/docker/test-utils";
import {type Stack} from "../../types";
import {StackActions} from "./stack-actions";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const commandStack = jest.fn();
const deleteStack = jest.fn();

jest.mock("../../api", () => ({
  commandStack: (...args: unknown[]) => commandStack(...args),
  deleteStack: (...args: unknown[]) => deleteStack(...args),
}));

function stack(overrides: Partial<Stack> = {}): Stack {
  return {
    uuid: "s-1",
    name: "shop",
    slug: "shop-x1y2z",
    vm_uuid: "vm-1",
    state: "running",
    created_at: "2026-10-04T12:00:00Z",
    ...overrides,
  };
}

const onDeleted = jest.fn();
const may = {own: true, manage: true, delete: true};

function actions(shown: Stack) {
  return renderWithProviders(
    <StackActions scope="mine" stack={shown} may={may} onDeleted={onDeleted} />,
  );
}

beforeEach(() => {
  commandStack.mockReset().mockResolvedValue(undefined);
  deleteStack.mockReset().mockResolvedValue(undefined);
  onDeleted.mockReset();
});

async function askToDelete() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", {name: "stacks.actions.delete"}));

  return {user, question: await screen.findByRole("dialog")};
}

describe("StackActions", () => {
  it("deletes a stack and keeps its volumes, unless asked otherwise", async () => {
    actions(stack());
    const {user, question} = await askToDelete();

    expect(
      within(question).getByRole("checkbox", {
        name: /stacks.actions.removeVolumes/,
      }),
    ).not.toBeChecked();

    await user.click(
      within(question).getByRole("button", {name: "stacks.actions.delete"}),
    );

    await waitFor(() =>
      expect(deleteStack).toHaveBeenCalledWith("mine", "s-1", false),
    );
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });

  it("takes the volumes with it when that is asked for too", async () => {
    actions(stack());
    const {user, question} = await askToDelete();

    await user.click(
      within(question).getByRole("checkbox", {
        name: /stacks.actions.removeVolumes/,
      }),
    );
    await user.click(
      within(question).getByRole("button", {name: "stacks.actions.delete"}),
    );

    await waitFor(() =>
      expect(deleteStack).toHaveBeenCalledWith("mine", "s-1", true),
    );
  });

  it("deletes nothing when the question is turned down", async () => {
    actions(stack());
    const {user, question} = await askToDelete();

    await user.click(
      within(question).getByRole("button", {name: "common.cancel"}),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(deleteStack).not.toHaveBeenCalled();
  });

  it("asks before stopping a running stack", async () => {
    const user = userEvent.setup();
    actions(stack());

    await user.click(screen.getByRole("button", {name: "stacks.actions.stop"}));
    const question = await screen.findByRole("dialog");
    expect(commandStack).not.toHaveBeenCalled();

    await user.click(
      within(question).getByRole("button", {name: "stacks.actions.stop"}),
    );

    await waitFor(() =>
      expect(commandStack).toHaveBeenCalledWith("mine", "s-1", "stop"),
    );
  });

  it("starts a stopped stack at once", async () => {
    const user = userEvent.setup();
    actions(stack({state: "stopped"}));

    await user.click(
      screen.getByRole("button", {name: "stacks.actions.start"}),
    );

    await waitFor(() =>
      expect(commandStack).toHaveBeenCalledWith("mine", "s-1", "start"),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("waits for a compose command to finish before another, but lets it be deleted", () => {
    actions(stack({state: "deploying"}));

    expect(
      screen.getByRole("button", {name: "stacks.actions.start"}),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {name: "stacks.actions.restart"}),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {name: "stacks.actions.delete"}),
    ).toBeEnabled();
  });
});
