import {act, renderHook, waitFor} from "@testing-library/react";
import {type LogLine} from "../types";
import {
  compareInstants,
  LOG_TAIL,
  mergeLogLines,
  useContainerLogs,
} from "./use-container-logs";

const fetchContainerLogs = jest.fn();

jest.mock("../api", () => ({
  fetchContainerLogs: (...args: unknown[]) => fetchContainerLogs(...args),
}));

const line = (at: string, text: string, stream = "stdout"): LogLine => ({
  at,
  stream,
  line: text,
});

describe("compareInstants", () => {
  it("orders moments by when they were, not by how they are written", () => {
    expect(
      compareInstants("2026-10-04T12:00:01Z", "2026-10-04T12:00:01.5Z"),
    ).toBeLessThan(0);
    expect(
      compareInstants(
        "2026-10-04T12:00:01.000000002Z",
        "2026-10-04T12:00:01.000000001Z",
      ),
    ).toBeGreaterThan(0);
    expect(
      compareInstants("2026-10-04T12:00:01.5Z", "2026-10-04T14:00:01.5+02:00"),
    ).toBe(0);
  });
});

describe("mergeLogLines", () => {
  const shown = [
    line("2026-10-04T12:00:00Z", "one"),
    line("2026-10-04T12:00:01Z", "two"),
    line("2026-10-04T12:00:01Z", "three"),
  ];

  it("drops what is handed back because it was written at the last moment shown", () => {
    const merged = mergeLogLines(shown, [
      line("2026-10-04T12:00:01Z", "two"),
      line("2026-10-04T12:00:01Z", "three"),
      line("2026-10-04T12:00:02Z", "four"),
    ]);

    expect(merged.map((each) => each.line)).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });

  it("keeps a different line written at that same moment", () => {
    const merged = mergeLogLines(shown, [
      line("2026-10-04T12:00:01Z", "three and a half", "stderr"),
    ]);

    expect(merged).toHaveLength(4);
  });

  it("drops anything older than what is shown", () => {
    expect(mergeLogLines(shown, [line("2026-10-04T11:59:59Z", "old")])).toBe(
      shown,
    );
  });

  it("lets the oldest lines go past the limit", () => {
    const merged = mergeLogLines(
      shown,
      [line("2026-10-04T12:00:02Z", "four")],
      2,
    );

    expect(merged.map((each) => each.line)).toEqual(["three", "four"]);
  });
});

describe("useContainerLogs", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchContainerLogs.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens on the tail and then asks only for what was written since", async () => {
    fetchContainerLogs
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

    const {result} = renderHook(() =>
      useContainerLogs("mine", "vm-1", "c-1", true),
    );

    await waitFor(() => expect(result.current.lines).toHaveLength(1));
    expect(fetchContainerLogs).toHaveBeenLastCalledWith("mine", "vm-1", "c-1", {
      since: undefined,
      tail: LOG_TAIL,
    });

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    await waitFor(() => expect(result.current.lines).toHaveLength(2));
    expect(fetchContainerLogs).toHaveBeenLastCalledWith("mine", "vm-1", "c-1", {
      since: "2026-10-04T12:00:01Z",
      tail: LOG_TAIL,
    });
  });

  it("asks for nothing while it is not being followed", () => {
    renderHook(() => useContainerLogs("mine", "vm-1", "c-1", false));

    expect(fetchContainerLogs).not.toHaveBeenCalled();
  });

  it("says what went wrong and keeps asking", async () => {
    fetchContainerLogs
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue({items: [line("2026-10-04T12:00:01Z", "back")]});

    const {result} = renderHook(() =>
      useContainerLogs("all", "vm-1", "c-1", true),
    );

    await waitFor(() => expect(result.current.problem).not.toBeNull());

    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });

    await waitFor(() => expect(result.current.problem).toBeNull());
    expect(result.current.lines).toHaveLength(1);
  });
});
