import {TextEncoder} from "util";
import {render, waitFor} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {TaskTerminal} from "./task-terminal";

// what is typed goes out as bytes; jsdom has no encoder of its own.
Object.assign(globalThis, {TextEncoder});

// what this is about is what the terminal says to the shell, not its words.
jest.mock("@/i18n/provider", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("js-cookie", () => ({
  __esModule: true,
  default: {get: () => "the-token"},
}));

jest.mock("./attach", () => ({
  BEARER_PROTOCOL: "bearer",
  attachURL: (uuid: string) => `ws://ingress/vms/${uuid}/attach`,
}));

// the size the box fits, which a test changes the way a window is resized.
const box = {rows: 40, cols: 120};

jest.mock("@xterm/xterm", () => ({
  Terminal: class {
    rows = 24;
    cols = 80;
    loadAddon(addon: {terminal: unknown}) {
      addon.terminal = this;
    }
    open() {}
    write() {}
    onData() {
      return {dispose() {}};
    }
    dispose() {}
  },
}));

jest.mock("@xterm/addon-fit", () => ({
  FitAddon: class {
    terminal: {rows: number; cols: number} | undefined;
    fit() {
      if (this.terminal) {
        this.terminal.rows = box.rows;
        this.terminal.cols = box.cols;
      }
    }
  },
}));

class FakeSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static sockets: FakeSocket[] = [];

  readyState = FakeSocket.CONNECTING;
  binaryType = "blob";
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: {data: unknown}) => void) | null = null;

  constructor(
    public url: string,
    public protocols?: string[],
  ) {
    FakeSocket.sockets.push(this);
  }

  send(data: unknown) {
    this.sent.push(data);
  }

  close() {}

  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }

  resizes() {
    return this.sent
      .filter((data): data is string => typeof data === "string")
      .map((data) => JSON.parse(data));
  }
}

// a box is measured as soon as it is watched, the way a browser does it, and
// again whenever a test says it was resized.
let measure: () => void = () => {};

class FakeResizeObserver {
  constructor(private callback: () => void) {
    measure = () => this.callback();
  }
  observe() {
    this.callback();
  }
  disconnect() {}
}

describe("TaskTerminal", () => {
  beforeEach(() => {
    FakeSocket.sockets = [];
    box.rows = 40;
    box.cols = 120;
    Object.defineProperty(window, "WebSocket", {
      writable: true,
      value: FakeSocket,
    });
    Object.defineProperty(window, "ResizeObserver", {
      writable: true,
      value: FakeResizeObserver,
    });
  });

  async function opened() {
    render(
      <MantineProvider env="test">
        <TaskTerminal taskUuid="vm-1" target="vms" running />
      </MantineProvider>,
    );

    await waitFor(() => expect(FakeSocket.sockets).toHaveLength(1));

    return FakeSocket.sockets[0];
  }

  it("is opened on the ingress with the token as a subprotocol", async () => {
    const socket = await opened();

    expect(socket.url).toBe("ws://ingress/vms/vm-1/attach");
    expect(socket.protocols).toEqual(["bearer", "the-token"]);
  });

  it("tells the shell the size it is drawn at as soon as it is open, though it was measured before", async () => {
    const socket = await opened();
    expect(socket.resizes()).toEqual([]);

    socket.open();

    expect(socket.resizes()).toEqual([{type: "resize", rows: 40, cols: 120}]);
  });

  it("tells the shell again only when the size changes", async () => {
    const socket = await opened();
    socket.open();

    measure();
    box.rows = 30;
    box.cols = 100;
    measure();

    expect(socket.resizes()).toEqual([
      {type: "resize", rows: 40, cols: 120},
      {type: "resize", rows: 30, cols: 100},
    ]);
  });
});
