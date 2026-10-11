import {render, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {type DependentsVisible} from "@/features/dashboard/workload/lib/dependents";
import {type VmKind} from "../types";
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
const mockDependents = jest.fn();
const mockNotify = jest.fn();

jest.mock("../actions/vm-commands", () => ({
  commandVm: (...args: unknown[]) => mockCommand(...args),
  deleteVm: (...args: unknown[]) => mockDelete(...args),
}));

jest.mock("../client", () => ({
  getVmDependents: (...args: unknown[]) => mockDependents(...args),
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

const nothingNeedsIt = {dependents: [], recreated: false};

// a stack and a container in the VM, each of which makes it again.
const needed = {
  dependents: [
    {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
    {kind: "container", uuid: "c-1", name: "api", recreates: true},
  ],
  recreated: true,
};

const everything: DependentsVisible = {stacks: true, containers: true};

beforeEach(() => {
  mockCommand.mockReset().mockResolvedValue({ok: true});
  mockDelete.mockReset().mockResolvedValue({ok: true, removal: nothingNeedsIt});
  mockDependents.mockReset().mockResolvedValue(nothingNeedsIt);
  mockNotify.mockReset();
});

function actions({
  state = "running",
  kind = "docker",
  managedBy,
  visible = everything,
}: {
  state?: "running" | "stopped";
  kind?: VmKind;
  managedBy?: "code-runner";
  visible?: DependentsVisible;
} = {}) {
  const onDeleted = jest.fn();
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

  render(
    <QueryClientProvider client={client}>
      <MantineProvider env="test">
        <VmActions
          vm={{uuid: "vm-1", name: "web", kind, state, managed_by: managedBy}}
          manage="mine"
          remove="mine"
          visible={visible}
          onDeleted={onDeleted}
        />
      </MantineProvider>
    </QueryClientProvider>,
  );

  return {onDeleted};
}

/** Asks to delete the VM, and waits until what needs it is known. */
async function askToDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", {name: "vms.actions.delete"}));
  const question = await screen.findByRole("dialog");
  const confirm = within(question).getByRole("button", {
    name: "vms.actions.delete",
  });
  await waitFor(() => expect(confirm).toBeEnabled());

  return {question, confirm};
}

describe("VmActions", () => {
  it("starts a stopped VM at once, and says so when it could not", async () => {
    const user = userEvent.setup();
    mockCommand.mockResolvedValue(refused);
    actions({state: "stopped"});

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
    expect(mockDependents).not.toHaveBeenCalled();
  });

  it("offers a run of the code runner's only to be stopped or deleted, each asked about first", async () => {
    const user = userEvent.setup();
    const {onDeleted} = actions({managedBy: "code-runner"});

    expect(
      screen.queryByRole("button", {name: "vms.actions.start"}),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {name: "vms.actions.restart"}),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", {name: "vms.actions.stop"}));
    const stopping = await screen.findByRole("dialog");
    expect(
      within(stopping).getByText("vms.actions.stopRunConfirm(web)"),
    ).toBeInTheDocument();
    await user.click(
      within(stopping).getByRole("button", {name: "vms.actions.stop"}),
    );
    await waitFor(() =>
      expect(mockCommand).toHaveBeenCalledWith("stop", "vm-1", "mine"),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    // a run has nothing in it but its snippet, so nothing is asked of what
    // needs it.
    await user.click(screen.getByRole("button", {name: "vms.actions.delete"}));
    const deleting = await screen.findByRole("dialog");
    expect(
      within(deleting).getByText("vms.actions.deleteRunConfirm(web)"),
    ).toBeInTheDocument();
    await user.click(
      within(deleting).getByRole("button", {name: "vms.actions.delete"}),
    );
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("vm-1", "mine", {
        cascade: false,
      }),
    );
    expect(onDeleted).toHaveBeenCalled();
    expect(mockDependents).not.toHaveBeenCalled();
  });

  it("keeps the question open with the refusal in it", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValue(refused);
    const {onDeleted} = actions();

    const {question, confirm} = await askToDelete(user);
    await user.click(confirm);

    expect(
      await within(question).findByText("The VM is being restored."),
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });
});

describe("VmActions, deleting a VM something needs", () => {
  it("asks nothing of what needs a VM that is not a Docker VM, which nothing can", async () => {
    const user = userEvent.setup();
    actions({kind: "machine"});

    await user.click(screen.getByRole("button", {name: "vms.actions.delete"}));
    const question = await screen.findByRole("dialog");
    const confirm = within(question).getByRole("button", {
      name: "vms.actions.delete",
    });

    expect(confirm).toBeEnabled();
    expect(
      within(question).queryByText("workload.dependents.checking"),
    ).not.toBeInTheDocument();

    await user.click(confirm);
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("vm-1", "mine", {
        cascade: false,
      }),
    );
    expect(mockDependents).not.toHaveBeenCalled();
  });

  it("reads what needs a Docker VM as the question opens, and the answer waits for it", async () => {
    const user = userEvent.setup();
    let answer: (removal: unknown) => void = () => {};
    mockDependents.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    actions();

    await user.click(screen.getByRole("button", {name: "vms.actions.delete"}));
    const question = await screen.findByRole("dialog");

    expect(mockDependents).toHaveBeenCalledWith("mine", "vm-1");
    expect(
      within(question).getByText("workload.dependents.checking"),
    ).toBeInTheDocument();
    expect(
      within(question).getByRole("button", {name: "vms.actions.delete"}),
    ).toBeDisabled();
    expect(
      within(question).getByRole("button", {name: "common.cancel"}),
    ).toBeEnabled();

    answer(needed);

    expect(
      await within(question).findByRole("radio", {
        name: "workload.dependents.alone.vm",
      }),
    ).toBeChecked();
    expect(
      within(question).getByRole("button", {name: "vms.actions.delete"}),
    ).toBeEnabled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("says what each that needs it does, linked to where it is looked at", async () => {
    const user = userEvent.setup();
    mockDependents.mockResolvedValue({
      dependents: [
        {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
        {kind: "container", uuid: "c-1", name: "api", recreates: false},
      ],
      recreated: true,
    });
    actions();

    const {question} = await askToDelete(user);

    const said = within(question)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(said).toEqual([
      "workload.dependents.stack.recreates(workload.dependents.what.vm) shop",
      "workload.dependents.container.waits(workload.dependents.what.vm) api",
    ]);
    expect(within(question).getByRole("link", {name: "shop"})).toHaveAttribute(
      "href",
      "/dashboard/stacks/s-1",
    );
    expect(within(question).getByRole("link", {name: "api"})).toHaveAttribute(
      "href",
      "/dashboard/containers/vm-1/c-1",
    );
  });

  it("links only what may be looked at", async () => {
    const user = userEvent.setup();
    mockDependents.mockResolvedValue(needed);
    actions({visible: {stacks: true, containers: false}});

    const {question} = await askToDelete(user);

    expect(
      within(question).getByRole("link", {name: "shop"}),
    ).toBeInTheDocument();
    expect(
      within(question).queryByRole("link", {name: "api"}),
    ).not.toBeInTheDocument();
    expect(within(question).getByText("api")).toBeInTheDocument();
  });

  it("deletes it together with what needs it, once that is chosen", async () => {
    const user = userEvent.setup();
    mockDependents.mockResolvedValue(needed);
    const {onDeleted} = actions();

    const {question, confirm} = await askToDelete(user);
    await user.click(
      within(question).getByRole("radio", {
        name: "workload.dependents.together.vm",
      }),
    );
    await user.click(confirm);

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("vm-1", "mine", {
        cascade: true,
      }),
    );
    expect(onDeleted).toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("deletes it alone, and says it will come back and what brings it back", async () => {
    const user = userEvent.setup();
    mockDependents.mockResolvedValue(needed);
    mockDelete.mockResolvedValue({ok: true, removal: needed});
    actions();

    const {confirm} = await askToDelete(user);
    await user.click(confirm);

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("vm-1", "mine", {
        cascade: false,
      }),
    );
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "workload.dependents.comesBack(web)",
        message:
          "workload.dependents.stack.recreates(workload.dependents.what.vm,shop) " +
          "workload.dependents.container.recreates(workload.dependents.what.vm,api)",
      }),
    );
  });

  it("asks the question again afresh, deleting alone, each time it opens", async () => {
    const user = userEvent.setup();
    mockDependents.mockResolvedValue(needed);
    actions();

    const first = await askToDelete(user);
    await user.click(
      within(first.question).getByRole("radio", {
        name: "workload.dependents.together.vm",
      }),
    );
    await user.click(
      within(first.question).getByRole("button", {name: "common.cancel"}),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    const again = await askToDelete(user);
    expect(mockDependents).toHaveBeenCalledTimes(2);
    expect(
      within(again.question).getByRole("radio", {
        name: "workload.dependents.alone.vm",
      }),
    ).toBeChecked();
  });

  it("still lets the VM be deleted when what needs it could not be read", async () => {
    const user = userEvent.setup();
    const config = {headers: new AxiosHeaders()} as InternalAxiosRequestConfig;

    // an API that does not know the route says it is not there.
    mockDependents.mockRejectedValue(
      new AxiosError(
        "failed",
        undefined,
        config,
        {},
        {
          status: 404,
          statusText: "",
          headers: {},
          config,
          data: "404 page not found",
        },
      ),
    );
    actions();

    const {question, confirm} = await askToDelete(user);
    expect(
      within(question).getByText("workload.dependents.checkFailed"),
    ).toBeInTheDocument();
    expect(
      within(question).queryByText(/workload\.errors/),
    ).not.toBeInTheDocument();
    expect(within(question).queryByRole("radio")).not.toBeInTheDocument();

    await user.click(confirm);
    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith("vm-1", "mine", {
        cascade: false,
      }),
    );
  });

  it("says once what needs it when the delete is refused for it, and offers to take it along", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({
      ok: false,
      problem: {
        status: 400,
        fields: {vm: "The VM is being restored."},
        dependents: [
          {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
        ],
        recreated: true,
        unanswered: false,
      },
    });
    actions();

    const {question, confirm} = await askToDelete(user);
    expect(within(question).queryByRole("radio")).not.toBeInTheDocument();
    await user.click(confirm);

    expect(
      await within(question).findByText("The VM is being restored."),
    ).toBeInTheDocument();
    expect(within(question).getAllByRole("listitem")).toHaveLength(1);
    expect(
      within(question).queryByText("workload.dependents.neededBy"),
    ).not.toBeInTheDocument();

    await user.click(
      within(question).getByRole("radio", {
        name: "workload.dependents.together.vm",
      }),
    );
    await user.click(confirm);

    await waitFor(() =>
      expect(mockDelete).toHaveBeenLastCalledWith("vm-1", "mine", {
        cascade: true,
      }),
    );
  });
});
