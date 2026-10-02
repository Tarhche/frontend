import {render, screen, waitFor} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {type Runtime} from "../../runtimes";
import {StackForm} from "./stack-form";

jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}(${Object.values(vars).join(",")})` : key,
}));

// the editor is a browser of its own; what the form sends is what is in the
// hidden input beside it, which is what this is about.
jest.mock("next/dynamic", () => () => () => null);

// what the form submits is the subject here, not what the backend does with it.
const run = jest.fn();

jest.mock("../../actions/run-stack", () => ({
  runStack: (state: unknown, formData: FormData) => run(formData),
}));

const sysbox: Runtime = {
  class: "sysbox",
  default: true,
  available: true,
  nodes: 3,
  capabilities: {isolation: "container", stack_networks: true},
};

const firecracker: Runtime = {
  class: "firecracker",
  default: false,
  available: true,
  nodes: 1,
  capabilities: {isolation: "microvm", stack_networks: false},
};

function form(runtimes: Runtime[] | null) {
  render(
    <MantineProvider>
      <StackForm runtimes={runtimes} />
    </MantineProvider>,
  );
}

// mantine draws an input's description inside its label, so a name is what
// it starts with.
const runtime = (name: string) =>
  screen.getByRole("radio", {name: new RegExp(`^${name}`)});

/** Names the stack, sends the form, and says what it sent. */
async function submit(user: UserEvent): Promise<FormData> {
  await user.type(
    screen.getByRole("textbox", {name: /^stacks\.form\.name/}),
    "shop",
  );
  await user.click(screen.getByRole("button", {name: "stacks.form.run"}));

  await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

  return run.mock.calls[0][0];
}

beforeEach(() => {
  run.mockReset();
  run.mockResolvedValue({});
});

describe("StackForm", () => {
  it("starts on the default class, and sends it for the whole stack", async () => {
    const user = userEvent.setup();
    form([sysbox, firecracker]);

    expect(runtime("sysbox")).toBeChecked();

    const sent = await submit(user);

    expect(sent.get("runtime")).toBe("sysbox");
  });

  it("does not offer a class that cannot give the services a network to share", () => {
    form([sysbox, firecracker]);

    expect(runtime("firecracker")).toBeDisabled();
    expect(runtime("firecracker")).toHaveAccessibleDescription(
      /tasks\.runtime\.noStackNetworks/,
    );
  });

  it("offers no choice and sends none when the workload said nothing", async () => {
    const user = userEvent.setup();
    form(null);

    expect(screen.queryByText("tasks.runtime.label")).not.toBeInTheDocument();

    const sent = await submit(user);

    expect(sent.has("runtime")).toBe(false);
  });

  it("says what the workload refused, and about which service", async () => {
    run.mockResolvedValue({
      errors: {
        runtime: "mixed_runtimes_in_stack",
        "web.image": "required_field",
      },
    });

    const user = userEvent.setup();
    form([sysbox, firecracker]);
    await submit(user);

    expect(
      await screen.findByText("mixed_runtimes_in_stack"),
    ).toBeInTheDocument();
    expect(screen.getByText("web.image: required_field")).toBeInTheDocument();
  });
});
