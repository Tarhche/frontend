import {fireEvent, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {
  dockerVm,
  renderWithProviders,
} from "@/features/dashboard/workload/docker/test-utils";
import {StackForm} from "./stack-form";
import {EXAMPLE_COMPOSE} from "./stack-request";

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

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({push, replace: jest.fn(), refresh: jest.fn()}),
  usePathname: () => "/dashboard/stacks/new",
}));

// the editor is CodeMirror, which jsdom cannot lay out; what this is about is
// what the form does with what is written in it.
jest.mock("../compose-editor", () => ({
  ComposeEditor: ({
    value,
    onChange,
    labelledBy,
  }: {
    value: string;
    onChange?: (value: string) => void;
    labelledBy?: string;
  }) => (
    <textarea
      aria-labelledby={labelledBy}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

const getAllVms = jest.fn();
const createStack = jest.fn();

jest.mock("@/features/dashboard/workload/vms/client", () => ({
  getAllVms: (...args: unknown[]) => getAllVms(...args),
}));

jest.mock("../../api", () => ({
  createStack: (...args: unknown[]) => createStack(...args),
}));

const config = {headers: new AxiosHeaders()} as InternalAxiosRequestConfig;

function refused(data: unknown) {
  return new AxiosError(
    "refused",
    undefined,
    config,
    {},
    {
      status: 400,
      statusText: "",
      headers: {},
      config,
      data,
    },
  );
}

beforeEach(() => {
  push.mockReset();
  createStack.mockReset();
  getAllVms.mockReset();
  getAllVms.mockResolvedValue([dockerVm({uuid: "vm-1", name: "docker-one"})]);
});

async function fill(name: string, compose: string) {
  const user = userEvent.setup();

  await screen.findByText(/dockerVms\.summary\.ports/);
  await user.type(
    screen.getByRole("textbox", {name: /stacks.form.name/}),
    name,
  );

  // a whole file is pasted rather than typed: YAML's braces mean something
  // to the keyboard simulation.
  fireEvent.change(screen.getByRole("textbox", {name: /stacks.form.compose/}), {
    target: {value: compose},
  });

  await user.click(screen.getByRole("button", {name: "stacks.form.deploy"}));
}

describe("StackForm", () => {
  it("starts from an example a person can deploy as it is", async () => {
    renderWithProviders(<StackForm vmSource={{scope: "mine"}} />);

    expect(
      await screen.findByRole("textbox", {name: /stacks.form.compose/}),
    ).toHaveValue(EXAMPLE_COMPOSE);
  });

  it("deploys the compose file into the VM it was given, and shows the stack", async () => {
    createStack.mockResolvedValue({
      vm: {uuid: "vm-1", name: "docker-one", created: false},
      stack: {uuid: "s-1", name: "shop", state: "deploying"},
    });
    renderWithProviders(<StackForm vmSource={{scope: "mine"}} />);

    await fill("shop", "services:\n  web:\n    image: nginx\n");

    await waitFor(() =>
      expect(createStack).toHaveBeenCalledWith({
        vm_uuid: "vm-1",
        name: "shop",
        compose: "services:\n  web:\n    image: nginx\n",
      }),
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/stacks/s-1"),
    );
  });

  it("asks for a name before sending anything", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StackForm vmSource={{scope: "mine"}} />);

    await screen.findByText(/dockerVms\.summary\.ports/);
    await user.click(screen.getByRole("button", {name: "stacks.form.deploy"}));

    expect(screen.getByText(/stacks.form.errors.required/)).toBeInTheDocument();
    expect(createStack).not.toHaveBeenCalled();
  });

  it("shows what was refused where it was written, with what compose said", async () => {
    createStack.mockRejectedValue(
      refused({
        errors: {compose: "services.web.image must be a string"},
        output: "validating compose.yaml: services.web.image must be a string",
      }),
    );
    renderWithProviders(<StackForm vmSource={{scope: "mine"}} />);

    await fill("shop", "services:\n  web:\n    image: [1]\n");

    expect(
      await screen.findByText("services.web.image must be a string"),
    ).toBeInTheDocument();
    expect(screen.getByText("stacks.form.composeOutput")).toBeInTheDocument();
    expect(
      screen.getByText(
        "validating compose.yaml: services.web.image must be a string",
      ),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("creates a Docker VM along with it for somebody who has none", async () => {
    getAllVms.mockResolvedValue([]);
    createStack.mockResolvedValue({
      vm: {uuid: "vm-9", name: "docker", created: true},
      stack: {uuid: "s-2", name: "shop", state: "deploying"},
    });

    const user = userEvent.setup();
    renderWithProviders(<StackForm vmSource={{scope: "mine"}} />);

    expect(
      await screen.findByText("dockerVms.select.willBeCreated"),
    ).toBeInTheDocument();
    await user.type(
      screen.getByRole("textbox", {name: /stacks.form.name/}),
      "shop",
    );
    await user.click(screen.getByRole("button", {name: "stacks.form.deploy"}));

    await waitFor(() => expect(createStack).toHaveBeenCalled());
    expect(createStack.mock.calls[0][0]).toMatchObject({
      name: "shop",
      compose: EXAMPLE_COMPOSE,
      vm: {name: "docker", network: {ingress: "allow", egress: "allow"}},
    });
  });
});
