import {compareInstants, latestAt, mergeLogLines} from "./logs";

// a VM's line says where in it it came from; a container's, which stream.
const vmLine = (at: string, text: string, source = "main") => ({
  at,
  source,
  line: text,
});

const containerLine = (at: string, text: string, stream = "stdout") => ({
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

describe("reading a log again", () => {
  const shown = [
    containerLine("2026-10-04T12:00:00Z", "one"),
    containerLine("2026-10-04T12:00:01Z", "two"),
    containerLine("2026-10-04T12:00:01Z", "three"),
  ];

  it("drops what is handed back because it was written at the last moment shown", () => {
    const merged = mergeLogLines(shown, [
      containerLine("2026-10-04T12:00:01Z", "two"),
      containerLine("2026-10-04T12:00:01Z", "three"),
      containerLine("2026-10-04T12:00:02Z", "four"),
    ]);

    expect(merged.map((each) => each.line)).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });

  it("keeps a different line written at that same moment", () => {
    expect(
      mergeLogLines(shown, [
        containerLine("2026-10-04T12:00:01Z", "three", "stderr"),
      ]),
    ).toHaveLength(4);

    const merged = mergeLogLines(
      [vmLine("2026-10-04T10:00:01Z", "a")],
      [
        vmLine("2026-10-04T10:00:01Z", "a"),
        vmLine("2026-10-04T10:00:01Z", "b"),
      ],
    );
    expect(merged.map((one) => one.line)).toEqual(["a", "b"]);
  });

  it("knows a moment however finely it is written", () => {
    const merged = mergeLogLines(
      [vmLine("2026-10-04T10:00:01Z", "ready")],
      [
        vmLine("2026-10-04T10:00:01.000Z", "ready"),
        vmLine("2026-10-04T10:00:01.000000001Z", "serving"),
      ],
    );

    expect(merged.map((one) => one.line)).toEqual(["ready", "serving"]);
  });

  it("changes nothing when nothing is new", () => {
    expect(mergeLogLines(shown, [])).toBe(shown);
    expect(
      mergeLogLines(shown, [containerLine("2026-10-04T11:59:59Z", "old")]),
    ).toBe(shown);
  });

  it("lets the oldest go past what it keeps", () => {
    const merged = mergeLogLines(
      shown,
      [containerLine("2026-10-04T12:00:02Z", "four")],
      2,
    );

    expect(merged.map((each) => each.line)).toEqual(["three", "four"]);
  });

  it("picks up from the latest line read", () => {
    expect(
      latestAt([
        vmLine("2026-10-04T10:00:02Z", "b"),
        vmLine("2026-10-04T10:00:01.5Z", "a"),
      ]),
    ).toBe("2026-10-04T10:00:02Z");
    expect(latestAt([], "2026-10-04T10:00:00Z")).toBe("2026-10-04T10:00:00Z");
    expect(
      latestAt(
        [vmLine("2026-10-04T10:00:00.5Z", "a")],
        "2026-10-04T10:00:00.25Z",
      ),
    ).toBe("2026-10-04T10:00:00.5Z");
  });
});
