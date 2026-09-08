import {render, act} from "@testing-library/react";
import {CodeRunSurface} from "./code-run-surface";
import {type Run} from "./run-workspace";

// what the runner is saying about the snippet while a test looks at it.
let reported: {run: Run; running: boolean; output: string} = {
  run: {},
  running: false,
  output: "",
};

jest.mock("./use-code-run", () => ({
  useCodeRun: () => ({
    run: reported.run,
    running: reported.running,
    output: reported.output,
    logs: "",
    start: jest.fn(),
    stop: jest.fn(),
    clear: jest.fn(),
  }),
}));

jest.mock("@/i18n/provider", () => ({
  useTranslations: () => (key: string) => key,
}));

// a shell is a container of its own; what this is about is whether the pieces
// of the card are drawn at all.
jest.mock("@/features/dashboard/runner/components/container-terminal", () => ({
  ContainerTerminal: () => null,
}));

function card(props: {ports: number[]; terminal: boolean; browser: boolean}) {
  const hosts = {
    preview: document.createElement("div"),
    panel: document.createElement("div"),
    tools: document.createElement("div"),
  };

  const onPreviewChange = jest.fn();

  const rendered = render(
    <CodeRunSurface
      hosts={hosts}
      runtime="go-1.24"
      code="package main"
      ports={props.ports}
      terminal={props.terminal}
      logs
      runToken={0}
      open={null}
      onOpen={jest.fn()}
      browser={props.browser}
      onBrowser={jest.fn()}
      onPreviewChange={onPreviewChange}
    />,
  );

  return {hosts, onPreviewChange, ...rendered};
}

/** Whether the card is showing a browser beside the code. */
const hasBrowser = (host: HTMLElement) => host.childElementCount > 0;

/** The buttons offered for looking at a running snippet. */
const toolLabels = (host: HTMLElement) =>
  [...host.querySelectorAll("button")].map((button) =>
    button.getAttribute("aria-label"),
  );

beforeEach(() => {
  reported = {
    run: {state: "running", container_uuid: "a-container"},
    running: true,
    output: "",
  };
});

describe("the run surface", () => {
  it("shows a browser for a snippet that serves a port", () => {
    const {hosts, onPreviewChange} = card({
      ports: [8080],
      terminal: false,
      browser: true,
    });

    expect(hasBrowser(hosts.preview)).toBe(true);
    expect(onPreviewChange).toHaveBeenLastCalledWith(true);
    expect(toolLabels(hosts.tools)).toContain("editor.tabs.browser");
  });

  it("shows none for a snippet that serves nothing", () => {
    // a terminal is a way in rather than something to look at: there is
    // nothing for a browser to show, so there is no browser and nothing to
    // turn on.
    const {hosts, onPreviewChange} = card({
      ports: [],
      terminal: true,
      browser: true,
    });

    expect(hasBrowser(hosts.preview)).toBe(false);
    expect(onPreviewChange).toHaveBeenLastCalledWith(false);
    expect(toolLabels(hosts.tools)).not.toContain("editor.tabs.browser");
    expect(toolLabels(hosts.tools)).toContain("editor.tabs.terminal");
  });

  it("shows none once the browser has been put away", () => {
    const {hosts, onPreviewChange} = card({
      ports: [8080],
      terminal: false,
      browser: false,
    });

    expect(hasBrowser(hosts.preview)).toBe(false);
    expect(onPreviewChange).toHaveBeenLastCalledWith(false);

    // the button that puts it away is still there to bring it back.
    expect(toolLabels(hosts.tools)).toContain("editor.tabs.browser");
  });

  it("names what a snippet that serves nothing printed", () => {
    // the page draws that result under a bar saying what it is, and the card
    // an author writes in draws the same one.
    reported = {
      run: {state: "completed"},
      running: false,
      output: "hello world",
    };

    const {hosts} = card({ports: [], terminal: false, browser: true});

    expect(hosts.panel.textContent).toContain("editor.programOutput");
    expect(hosts.panel.textContent).toContain("hello world");
  });

  it("takes the browser away with the container behind it", () => {
    const {hosts, rerender} = card({
      ports: [8080],
      terminal: false,
      browser: true,
    });

    expect(hasBrowser(hosts.preview)).toBe(true);

    act(() => {
      reported = {run: {state: "completed"}, running: false, output: ""};
    });

    rerender(
      <CodeRunSurface
        hosts={hosts}
        runtime="go-1.24"
        code="package main"
        ports={[8080]}
        terminal={false}
        logs
        runToken={0}
        open={null}
        onOpen={jest.fn()}
        browser
        onBrowser={jest.fn()}
      />,
    );

    expect(hasBrowser(hosts.preview)).toBe(false);
    expect(toolLabels(hosts.tools)).toHaveLength(0);
  });
});
