import {type ContainerStats} from "../types";
import {keepSample, ratesOf} from "./use-container-stats";

const sample = (
  sampled_at: string,
  counters: Partial<ContainerStats> = {},
): ContainerStats => ({
  cpu_percent: 0,
  memory_used: 0,
  memory_limit: 0,
  network_rx: 0,
  network_tx: 0,
  block_read: 0,
  block_write: 0,
  pids: 0,
  sampled_at,
  ...counters,
});

describe("keepSample", () => {
  it("does not count the same sample twice", () => {
    const first = [sample("2026-10-04T12:00:00Z")];

    expect(keepSample(first, sample("2026-10-04T12:00:00Z"))).toBe(first);
  });

  it("keeps only so many, letting the oldest go", () => {
    const kept = keepSample(
      [sample("2026-10-04T12:00:00Z"), sample("2026-10-04T12:00:05Z")],
      sample("2026-10-04T12:00:10Z"),
      2,
    );

    expect(kept.map((each) => each.sampled_at)).toEqual([
      "2026-10-04T12:00:05Z",
      "2026-10-04T12:00:10Z",
    ]);
  });
});

describe("ratesOf", () => {
  it("says how fast a counter grew, per second", () => {
    const rates = ratesOf(
      [
        sample("2026-10-04T12:00:00Z", {network_rx: 1_000}),
        sample("2026-10-04T12:00:05Z", {network_rx: 6_000}),
      ],
      (each) => each.network_rx,
    );

    expect(rates).toEqual([1_000]);
  });

  it("reads a counter that went back to zero as a restart, not as a loss", () => {
    const rates = ratesOf(
      [
        sample("2026-10-04T12:00:00Z", {network_rx: 9_000}),
        sample("2026-10-04T12:00:05Z", {network_rx: 10}),
      ],
      (each) => each.network_rx,
    );

    expect(rates).toEqual([0]);
  });
});
