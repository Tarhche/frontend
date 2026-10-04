import {latestAt, mergeLogLines} from "./logs";

const line = (at: string, text: string, source = "main") => ({
  at,
  source,
  line: text,
});

describe("reading a VM's logs again", () => {
  it("keeps the lines at the moment it picked up from once", () => {
    const shown = [
      line("2026-10-04T10:00:00Z", "booting", "kernel"),
      line("2026-10-04T10:00:01Z", "ready"),
    ];

    // a read since 10:00:01 takes 10:00:01 in.
    const merged = mergeLogLines(shown, [
      line("2026-10-04T10:00:01Z", "ready"),
      line("2026-10-04T10:00:02Z", "serving"),
    ]);

    expect(merged.map((one) => one.line)).toEqual([
      "booting",
      "ready",
      "serving",
    ]);
  });

  it("keeps lines written at the same moment that are not the same", () => {
    const merged = mergeLogLines(
      [line("2026-10-04T10:00:01Z", "a")],
      [line("2026-10-04T10:00:01Z", "a"), line("2026-10-04T10:00:01Z", "b")],
    );

    expect(merged.map((one) => one.line)).toEqual(["a", "b"]);
  });

  it("changes nothing when nothing is new", () => {
    const shown = [line("2026-10-04T10:00:01Z", "a")];

    expect(mergeLogLines(shown, [])).toBe(shown);
    expect(mergeLogLines(shown, [line("2026-10-04T10:00:00Z", "old")])).toBe(
      shown,
    );
  });

  it("lets the oldest go past what it keeps", () => {
    const merged = mergeLogLines(
      [line("2026-10-04T10:00:00Z", "1"), line("2026-10-04T10:00:01Z", "2")],
      [line("2026-10-04T10:00:02Z", "3")],
      2,
    );

    expect(merged.map((one) => one.line)).toEqual(["2", "3"]);
  });

  it("picks up from the latest line read", () => {
    expect(
      latestAt([
        line("2026-10-04T10:00:02Z", "b"),
        line("2026-10-04T10:00:01Z", "a"),
      ]),
    ).toBe("2026-10-04T10:00:02Z");
    expect(latestAt([], "2026-10-04T10:00:00Z")).toBe("2026-10-04T10:00:00Z");
  });
});
