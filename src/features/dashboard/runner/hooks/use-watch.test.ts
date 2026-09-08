import {renderHook, act, waitFor} from "@testing-library/react";
import {encode} from "js-base64";
import {type StreamHandlers} from "@/lib/ws/websocket-bus";
import {useWatch} from "./use-watch";

// what the page opened, so a test can end it the way the server would.
const opened: StreamHandlers[] = [];
const closed = jest.fn();

jest.mock("@/hooks/use-ws-stream", () => ({
  useWsStream: () => (_subject: string, _data: unknown, handlers: unknown) => {
    opened.push(handlers as StreamHandlers);

    return Promise.resolve({id: "stream", send: jest.fn(), close: closed});
  },
}));

jest.mock("js-cookie", () => ({
  __esModule: true,
  default: {get: () => "a-token"},
}));

const watch = () => {
  const onChange = jest.fn();
  const onResume = jest.fn();

  const rendered = renderHook(() =>
    useWatch({subject: "runnerContainersWatch", onChange, onResume}),
  );

  return {onChange, onResume, ...rendered};
};

beforeEach(() => {
  opened.length = 0;
  closed.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useWatch", () => {
  it("carries every change to whoever is showing it", async () => {
    const {onChange} = watch();

    await waitFor(() => expect(opened).toHaveLength(1));

    act(() => opened[0].onChunk("a-change"));

    expect(onChange).toHaveBeenCalledWith("a-change");
  });

  it("opens the watch again when it ends, and says it had to", async () => {
    const {onResume} = watch();

    await waitFor(() => expect(opened).toHaveLength(1));

    // the runner was restarted: the watch ends with nothing to say about it.
    act(() => opened[0].onEnd?.(null));
    expect(onResume).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });

    await waitFor(() => expect(opened).toHaveLength(2));
    await waitFor(() => expect(onResume).toHaveBeenCalled());
  });

  it("keeps carrying changes over the watch it opened again", async () => {
    const {onChange} = watch();

    await waitFor(() => expect(opened).toHaveLength(1));

    act(() => opened[0].onEnd?.(null));
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    await waitFor(() => expect(opened).toHaveLength(2));

    act(() => opened[1].onChunk("a-later-change"));

    expect(onChange).toHaveBeenCalledWith("a-later-change");
  });

  it("does not ask again when the watch was refused", async () => {
    watch();

    await waitFor(() => expect(opened).toHaveLength(1));

    // a refusal is an answer: asking again would only be refused again.
    act(() =>
      opened[0].onEnd?.(
        encode(JSON.stringify({errors: {access_token: "unauthenticated"}})),
      ),
    );

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect(opened).toHaveLength(1);
  });

  it("lets the watch go when the page does", async () => {
    const {unmount} = watch();

    await waitFor(() => expect(opened).toHaveLength(1));

    unmount();

    expect(closed).toHaveBeenCalled();
  });
});
