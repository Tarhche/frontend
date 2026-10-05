import {type VmStats} from "../types";
import {
  appendSample,
  clampPercent,
  formatPercent,
  hasStats,
  percentOf,
  sampleOf,
  severityOf,
} from "./stats";
import {GiB, MiB} from "./units";

const stats: VmStats = {
  cpu_percent: 37.5,
  memory_used: 512 * MiB,
  memory_limit: 2 * GiB,
  disk_used: 18 * GiB,
  disk_total: 20 * GiB,
  network_rx: 0,
  network_tx: 0,
  sampled_at: "2026-10-04T10:00:05Z",
};

describe("reading stats", () => {
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

  it("says there are none until a sample was taken", () => {
    expect(hasStats(stats)).toBe(true);
    expect(hasStats(null)).toBe(false);
    expect(hasStats({...stats, sampled_at: "0001-01-01T00:00:00Z"})).toBe(
      false,
    );
    expect(hasStats({...stats, sampled_at: ""})).toBe(false);
  });

  it("takes each part of a sample as a share of what the VM has", () => {
    expect(sampleOf(stats)).toEqual({
      at: stats.sampled_at,
      cpu: 37.5,
      memory: 25,
      disk: 90,
    });
  });
});

describe("the samples a page keeps", () => {
  const sample = (at: string) => ({at, cpu: 1, memory: 2, disk: 3});

  it("keeps a sample once, however often it is read", () => {
    const one = appendSample([], sample("a"));

    expect(appendSample(one, sample("a"))).toBe(one);
    expect(appendSample(one, sample("b"))).toHaveLength(2);
  });

  it("keeps only the latest", () => {
    let kept = [sample("0")];
    for (let i = 1; i < 10; i++) {
      kept = appendSample(kept, sample(String(i)), 4);
    }

    expect(kept.map((one) => one.at)).toEqual(["6", "7", "8", "9"]);
  });
});
