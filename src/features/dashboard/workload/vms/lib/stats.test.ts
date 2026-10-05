import {type VmStats} from "../types";
import {hasStats, sampleOf} from "./stats";
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

describe("reading a VM's stats", () => {
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
