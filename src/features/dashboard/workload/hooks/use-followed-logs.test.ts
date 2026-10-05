import {act, renderHook, waitFor} from "@testing-library/react";
import {LOG_TAIL, LOGS_POLL_MS, useFollowedLogs} from "./use-followed-logs";

const read = jest.fn();

const line = (at: string, text: string, stream = "stdout") => ({
  at,
  stream,
  line: text,
});

function follow(following = true) {
  return renderHook(() => useFollowedLogs("c-1", read, following));
}

describe("useFollowedLogs", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    read.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens on the tail and then asks only for what was written since", async () => {
    read
      .mockResolvedValueOnce({
        items: [line("2026-10-04T12:00:01Z", "first")],
      })
      .mockResolvedValueOnce({
        items: [
          line("2026-10-04T12:00:01Z", "first"),
          line("2026-10-04T12:00:03Z", "second"),
        ],
      })
      .mockResolvedValue({items: []});

    const {result} = follow();

    await waitFor(() => expect(result.current.lines).toHaveLength(1));
    expect(read).toHaveBeenLastCalledWith({tail: LOG_TAIL});

    await act(async () => {
      jest.advanceTimersByTime(LOGS_POLL_MS);
    });

    await waitFor(() => expect(result.current.lines).toHaveLength(2));
    expect(read).toHaveBeenLastCalledWith({since: "2026-10-04T12:00:01Z"});
  });

  it("asks for nothing while it is not being followed", () => {
    follow(false);

    expect(read).not.toHaveBeenCalled();
  });

  it("says what went wrong and keeps asking", async () => {
    read
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue({items: [line("2026-10-04T12:00:01Z", "back")]});

    const {result} = follow();

    await waitFor(() => expect(result.current.problem).not.toBeNull());

    await act(async () => {
      jest.advanceTimersByTime(LOGS_POLL_MS);
    });

    await waitFor(() => expect(result.current.problem).toBeNull());
    expect(result.current.lines).toHaveLength(1);
  });

  it("says when more was written between two reads than one could carry", async () => {
    read
      .mockResolvedValueOnce({
        items: [line("2026-10-04T12:00:01Z", "first")],
        truncated: true,
      })
      .mockResolvedValue({
        items: [line("2026-10-04T12:00:09Z", "much later")],
        truncated: true,
      });

    const {result} = follow();

    // the first read asks for the last lines, and is never short of any.
    await waitFor(() => expect(result.current.lines).toHaveLength(1));
    expect(result.current.skipped).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(LOGS_POLL_MS);
    });

    await waitFor(() => expect(result.current.skipped).toBe(true));
  });
});
