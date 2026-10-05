import {GiB, MiB} from "@/features/dashboard/workload/vms/lib/units";
import {
  appendSample,
  clampPercent,
  formatPercent,
  percentOf,
  ratesOf,
  severityOf,
} from "./usage";

describe("reading what something uses", () => {
  it("says what share of something is used", () => {
    expect(percentOf(512 * MiB, 2 * GiB)).toBe(25);
    expect(percentOf(1, 0)).toBe(0);
    expect(percentOf(3, 2)).toBe(100);
  });

  it("keeps a share within a bar", () => {
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it("reads a share with a decimal only while it is small", () => {
    expect(formatPercent(3.25)).toBe("3.3%");
    expect(formatPercent(37.5)).toBe("38%");
    expect(formatPercent(100)).toBe("100%");
    expect(formatPercent(Number.NaN)).toBe("0%");
  });

  it("is worried from 70%, and very from 90%", () => {
    expect(severityOf(69)).toBe("normal");
    expect(severityOf(70)).toBe("warning");
    expect(severityOf(89.9)).toBe("warning");
    expect(severityOf(90)).toBe("critical");
  });
});

describe("the samples a page keeps", () => {
  const sample = (at: string) => ({at, cpu: 1, memory: 2, disk: 3});
  const atOf = (one: {at: string}) => one.at;

  it("keeps a sample once, however often it is read", () => {
    const one = appendSample([], sample("a"), atOf);

    expect(appendSample(one, sample("a"), atOf)).toBe(one);
    expect(appendSample(one, sample("b"), atOf)).toHaveLength(2);
  });

  it("keeps only the latest", () => {
    let kept = [sample("0")];
    for (let i = 1; i < 10; i++) {
      kept = appendSample(kept, sample(String(i)), atOf, 4);
    }

    expect(kept.map((one) => one.at)).toEqual(["6", "7", "8", "9"]);
  });
});

describe("how fast a counter goes", () => {
  const counted = (at: string, received: number) => ({at, received});
  const atOf = (one: {at: string}) => one.at;
  const received = (one: {received: number}) => one.received;

  it("says how fast a counter grew, per second", () => {
    expect(
      ratesOf(
        [
          counted("2026-10-04T12:00:00Z", 1_000),
          counted("2026-10-04T12:00:05Z", 6_000),
        ],
        received,
        atOf,
      ),
    ).toEqual([1_000]);
  });

  it("reads a counter that went back to zero as a restart, not as a loss", () => {
    expect(
      ratesOf(
        [
          counted("2026-10-04T12:00:00Z", 9_000),
          counted("2026-10-04T12:00:05Z", 10),
        ],
        received,
        atOf,
      ),
    ).toEqual([0]);
  });
});
