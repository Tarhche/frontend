import {decode, encode} from "js-base64";
import {ReplyKind, WebSocketBus} from "./websocket-bus";

/**
 * FakeSocket stands in for the browser's WebSocket: it opens on the next tick,
 * records what was sent, and lets a test play the server's side.
 */
class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];

  readyState = FakeSocket.OPEN;
  sent: string[] = [];

  private listeners = new Map<string, ((event: unknown) => void)[]>();

  constructor(public url: string) {
    FakeSocket.instances.push(this);

    // the bus waits for "open" before it sends anything.
    queueMicrotask(() => this.emit("open", {}));
  }

  addEventListener(type: string, handler: (event: unknown) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(handler);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.emit("close", {});
  }

  /** deliver plays one message from the server. */
  deliver(message: Record<string, unknown>) {
    this.emit("message", {data: JSON.stringify(message)});
  }

  private emit(type: string, event: unknown) {
    this.listeners.get(type)?.forEach((handler) => handler(event));
  }

  get messages(): Record<string, unknown>[] {
    return this.sent.map((raw) => JSON.parse(raw));
  }
}

beforeEach(() => {
  FakeSocket.instances = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = FakeSocket;

  let requests = 0;

  Object.defineProperty(globalThis, "crypto", {
    value: {randomUUID: () => `req-${++requests}`},
    configurable: true,
  });
});

function newBus() {
  return new WebSocketBus("ws://localhost/api/ws");
}

describe("WebSocketBus streaming", () => {
  it("opens a stream and hands every chunk over as it arrives", async () => {
    const bus = newBus();
    const chunks: (string | null)[] = [];

    const stream = await bus.openStream(
      "runnerContainerLogs",
      {container_uuid: "c-1"},
      {onChunk: (payload) => chunks.push(payload)},
    );

    const socket = FakeSocket.instances[0];

    expect(socket.messages[0]).toMatchObject({
      id: "req-1",
      subject: "runnerContainerLogs",
    });

    socket.deliver({
      request_id: stream.id,
      kind: ReplyKind.Chunk,
      payload: encode("first"),
    });
    socket.deliver({
      request_id: stream.id,
      kind: ReplyKind.Chunk,
      payload: encode("second"),
    });

    expect(chunks).toEqual([encode("first"), encode("second")]);
  });

  it("ends the stream when the server says it is over", async () => {
    const bus = newBus();

    const onChunk = jest.fn();
    const onEnd = jest.fn();

    const stream = await bus.openStream("s", undefined, {onChunk, onEnd});
    const socket = FakeSocket.instances[0];

    socket.deliver({request_id: stream.id, kind: ReplyKind.EOF});

    expect(onEnd).toHaveBeenCalledTimes(1);

    // nothing arriving after the end reaches the caller.
    socket.deliver({
      request_id: stream.id,
      kind: ReplyKind.Chunk,
      payload: encode("late"),
    });

    expect(onChunk).not.toHaveBeenCalled();
  });

  it("treats a whole answer as the end of the stream", async () => {
    const bus = newBus();

    const onChunk = jest.fn();
    const onEnd = jest.fn();

    const stream = await bus.openStream("s", undefined, {onChunk, onEnd});
    const socket = FakeSocket.instances[0];

    // a reply with no kind is the ordinary one-shot answer, which ends the
    // request it answers.
    socket.deliver({request_id: stream.id, payload: encode("{}")});

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onChunk).not.toHaveBeenCalled();
  });

  it("carries input to the stream it belongs to, with no id of its own", async () => {
    const bus = newBus();

    const stream = await bus.openStream("attach", undefined, {
      onChunk: jest.fn(),
    });
    const socket = FakeSocket.instances[0];

    stream.send("attachInput", {data: "bHM="});

    const input = socket.messages[1];
    expect(input).toMatchObject({
      stream_id: stream.id,
      subject: "attachInput",
    });
    expect(input).not.toHaveProperty("id");
  });

  it("closing a stream names it with no subject, which asks for it to end", async () => {
    const bus = newBus();

    const stream = await bus.openStream("attach", undefined, {
      onChunk: jest.fn(),
    });
    const socket = FakeSocket.instances[0];

    stream.close();

    expect(socket.messages[1]).toEqual({stream_id: stream.id});
  });

  it("a closed stream no longer takes chunks", async () => {
    const bus = newBus();

    const onChunk = jest.fn();
    const stream = await bus.openStream("s", undefined, {onChunk});
    const socket = FakeSocket.instances[0];

    stream.close();
    socket.deliver({
      request_id: stream.id,
      kind: ReplyKind.Chunk,
      payload: encode("late"),
    });

    expect(onChunk).not.toHaveBeenCalled();
  });

  it("opens a stream again on a new connection when the old one goes away", async () => {
    const bus = newBus();

    const onChunk = jest.fn();
    const onReopen = jest.fn();
    const onError = jest.fn();

    const stream = await bus.openStream(
      "runnerContainerAttach",
      {container_uuid: "c-1"},
      {onChunk, onReopen, onError},
    );

    FakeSocket.instances[0].close();

    // the reconnection is a socket of its own, opened on the next tick.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FakeSocket.instances).toHaveLength(2);
    expect(onReopen).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();

    const reopened = FakeSocket.instances[1];
    expect(reopened.messages[0]).toMatchObject({
      subject: "runnerContainerAttach",
    });

    // the stream answers to the id it was opened again under, and the handle
    // names that one.
    const id = (reopened.messages[0] as {id: string}).id;
    expect(stream.id).toBe(id);

    reopened.deliver({
      request_id: id,
      kind: ReplyKind.Chunk,
      payload: encode("after the drop"),
    });

    expect(onChunk).toHaveBeenCalledWith(encode("after the drop"));
  });

  it("asks for what the caller wants now when it opens a stream again", async () => {
    const bus = newBus();

    let after = "09:00";

    await bus.openStream("runnerContainerLogs", () => ({after}), {
      onChunk: jest.fn(),
    });

    // the caller has caught up since; opening the stream again picks up from
    // there rather than replaying what it already has.
    after = "09:05";

    FakeSocket.instances[0].close();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const message = FakeSocket.instances[1].messages[0] as {payload: string};
    expect(JSON.parse(decode(message.payload))).toEqual({after: "09:05"});
  });

  it("a stream the caller closed is not opened again", async () => {
    const bus = newBus();

    const onReopen = jest.fn();
    const stream = await bus.openStream("s", undefined, {
      onChunk: jest.fn(),
      onReopen,
    });

    stream.close();
    FakeSocket.instances[0].close();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onReopen).not.toHaveBeenCalled();
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("leaves a one-shot request to the pending map, not to the streams", async () => {
    const bus = newBus();

    const answered = bus.publish("runCode", {code: "print(1)"});

    // publish waits for the socket to open before it registers the request, so
    // the answer cannot arrive before that has happened.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const socket = FakeSocket.instances[0];

    socket.deliver({
      request_id: "req-1",
      payload: encode(JSON.stringify({ok: true})),
    });

    await expect(answered).resolves.toEqual({ok: true});
  });
});
