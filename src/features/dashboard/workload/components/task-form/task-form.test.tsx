import {render, screen, waitFor} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {type Runtime} from "../../runtimes";
import {TaskForm} from "./task-form";

// what the dictionary has words for, in the tests that need any. Otherwise the
// form's words are the keys it asks for, which is what this is about.
let mockWords: Record<string, string> = {};

jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      mockWords[key] ??
      (vars ? `${key}(${Object.values(vars).join(",")})` : key),
}));

// what the form submits is the subject here, not what the backend does with it.
const run = jest.fn();

jest.mock("../../actions/run-task", () => ({
  runTask: (state: unknown, formData: FormData) => run(formData),
}));

const MiB = 1024 ** 2;

const sysbox: Runtime = {
  class: "sysbox",
  default: true,
  available: true,
  nodes: 3,
  capabilities: {
    isolation: "container",
    network_policies: ["none", "isolated", "public"],
    stack_networks: true,
    read_only_root: true,
    restart_policies: ["no", "always", "on-failure", "unless-stopped"],
    min_memory: 0,
    max_memory: 0,
    max_cpu: 0,
  },
};

const other: Runtime = {
  class: "other",
  default: false,
  available: true,
  nodes: 1,
  capabilities: {
    isolation: "microvm",
    network_policies: ["none", "isolated"],
    stack_networks: false,
    read_only_root: false,
    restart_policies: ["no", "always", "on-failure"],
    min_memory: 128 * MiB,
    max_memory: 2048 * MiB,
    max_cpu: 2,
  },
};

function form(runtimes: Runtime[] | null) {
  render(
    <MantineProvider>
      <TaskForm runtimes={runtimes} />
    </MantineProvider>,
  );
}

// mantine draws an input's description inside its label, so a name is what
// it starts with.
const runtime = (name: string) =>
  screen.getByRole("radio", {name: new RegExp(`^${name}`)});

const network = (policy: "None" | "Isolated" | "Public") =>
  screen.getByRole("radio", {
    name: new RegExp(`^tasks\\.form\\.network${policy}`),
  });

const readOnly = () =>
  screen.getByRole("switch", {name: /^tasks\.form\.readOnly/});

/** Fills in what has to be filled in, sends the form, and says what it sent. */
async function submit(user: UserEvent): Promise<FormData> {
  await user.type(
    screen.getByRole("textbox", {name: /^tasks\.form\.name/}),
    "w",
  );
  await user.type(
    screen.getByRole("textbox", {name: /^tasks\.form\.image/}),
    "nginx",
  );
  await user.click(screen.getByRole("button", {name: "tasks.form.run"}));

  await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

  return run.mock.calls[0][0];
}

beforeEach(() => {
  mockWords = {};
  run.mockReset();
  run.mockResolvedValue({});
});

describe("TaskForm", () => {
  it("starts on the class the workload runs a task as by default", () => {
    form([other, sysbox]);

    expect(runtime("sysbox")).toBeChecked();
    expect(runtime("other")).not.toBeChecked();
  });

  it("says which class is the default, and what each one is", () => {
    mockWords = {
      "tasks.runtime.classes.other": "Another runtime",
      "tasks.runtime.hints.microvm": "Its own kernel; stronger isolation.",
    };

    form([sysbox, other]);

    expect(runtime("sysbox")).toHaveAccessibleName(/tasks\.runtime\.default/);
    expect(runtime("Another runtime")).toHaveAccessibleDescription(
      "Its own kernel; stronger isolation.",
    );
  });

  it("shows a class no node can run, but not as one to choose, and says why", () => {
    form([sysbox, {...other, available: false, nodes: 0}]);

    expect(runtime("other")).toBeDisabled();
    expect(runtime("other")).toHaveAccessibleDescription(
      /tasks\.runtime\.unavailable/,
    );
    expect(runtime("sysbox")).toBeEnabled();
  });

  it("starts on a class that can be run when no node can run the default", () => {
    form([{...sysbox, available: false, nodes: 0}, other]);

    expect(runtime("other")).toBeChecked();
    expect(runtime("sysbox")).toBeDisabled();
  });

  it("holds back what the chosen class cannot honour, and only while it is chosen", async () => {
    const user = userEvent.setup();
    form([sysbox, other]);

    expect(network("Public")).toBeEnabled();
    expect(readOnly()).toBeEnabled();

    await user.click(runtime("other"));

    expect(network("Public")).toBeDisabled();
    expect(network("Public")).toHaveAccessibleDescription(
      "tasks.runtime.unsupported",
    );
    expect(network("Isolated")).toBeEnabled();
    expect(network("None")).toBeEnabled();
    expect(readOnly()).toBeDisabled();

    await user.click(runtime("sysbox"));

    expect(network("Public")).toBeEnabled();
    expect(readOnly()).toBeEnabled();
  });

  it("says what the chosen class allows of the limits it has", async () => {
    const user = userEvent.setup();
    form([sysbox, other]);

    expect(
      screen.queryByText(/tasks\.runtime\.cpusAtMost/),
    ).not.toBeInTheDocument();

    await user.click(runtime("other"));

    expect(screen.getByText("tasks.runtime.cpusAtMost(2)")).toBeInTheDocument();
    expect(
      screen.getByText("tasks.runtime.memoryBetween(128M,2G)"),
    ).toBeInTheDocument();
  });

  it("sends the class that was chosen", async () => {
    const user = userEvent.setup();
    form([sysbox, other]);

    await user.click(runtime("other"));
    const sent = await submit(user);

    expect(sent.get("runtime")).toBe("other");
  });

  it("sends what the chosen class can honour rather than what it cannot", async () => {
    const user = userEvent.setup();
    form([sysbox, other]);

    await user.click(network("Public"));
    await user.click(readOnly());
    await user.click(runtime("other"));

    // never more of a network than was asked for
    expect(network("Isolated")).toBeChecked();
    expect(readOnly()).not.toBeChecked();

    const sent = await submit(user);

    expect(sent.get("runtime")).toBe("other");
    expect(sent.get("network_mode")).toBe("isolated");
    expect(sent.get("read_only")).toBeNull();
    expect(sent.get("restart")).toBe("always");
  });

  it("offers no choice, holds nothing back and sends none when the workload said nothing", async () => {
    const user = userEvent.setup();
    form(null);

    expect(screen.queryByText("tasks.runtime.label")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radio", {name: /^sysbox/}),
    ).not.toBeInTheDocument();
    expect(network("Public")).toBeEnabled();
    expect(readOnly()).toBeEnabled();

    const sent = await submit(user);

    expect(sent.has("runtime")).toBe(false);
    expect(sent.get("network_mode")).toBe("isolated");
  });

  it("keeps what was chosen when the workload refuses the task", async () => {
    run.mockResolvedValue({errors: {image: "image_not_found"}});

    const user = userEvent.setup();
    form([sysbox, other]);

    await user.click(runtime("other"));
    await user.click(network("None"));
    await submit(user);

    // the form is put back the way it was drawn once it is answered, which
    // would otherwise be the default class and the default network again.
    expect(await screen.findByText("image_not_found")).toBeInTheDocument();
    expect(runtime("other")).toBeChecked();
    expect(runtime("sysbox")).not.toBeChecked();
    expect(network("None")).toBeChecked();
  });

  it("says what the workload refused in words, wherever it has a field for it or not", async () => {
    mockWords = {
      "errors.validation.invalid_value": "the provided value is invalid",
      "errors.validation.not_supported": "this field is not supported yet",
    };
    run.mockResolvedValue({
      errors: {
        runtime: "invalid_value",
        mounts: "not_supported",
        ttl: "only a job can be given a time limit",
      },
    });

    const user = userEvent.setup();
    form([sysbox, other]);
    await submit(user);

    expect(
      await screen.findByText("the provided value is invalid"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("this field is not supported yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("only a job can be given a time limit"),
    ).toBeInTheDocument();
  });

  it("says what the workload refused about its default class when there was no choice of one", async () => {
    run.mockResolvedValue({errors: {runtime: "invalid_value"}});

    const user = userEvent.setup();
    form(null);
    await submit(user);

    expect(await screen.findByText("invalid_value")).toBeInTheDocument();
  });
});
