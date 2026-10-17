import {renderHook} from "@testing-library/react";
import {type StatsSample} from "../lib/stats";
import {type VmStats} from "../types";
import {useStatsSamples} from "./use-stats-samples";

const stats = (at: string, cpu: number): VmStats => ({
  cpu_percent: cpu,
  memory_used: 1,
  memory_limit: 4,
  disk_used: 1,
  disk_total: 2,
  network_rx: 0,
  network_tx: 0,
  sampled_at: at,
});

describe("useStatsSamples", () => {
  it("keeps one sample for each the node took while the page was open", () => {
    const {result, rerender} = renderHook<
      StatsSample[],
      {current: VmStats | null}
    >(({current}) => useStatsSamples(current), {
      initialProps: {current: stats("2026-10-04T10:00:00Z", 10)},
    });

    expect(result.current).toHaveLength(1);

    // read again before the node sampled again: the same sample.
    rerender({current: stats("2026-10-04T10:00:00Z", 10)});
    expect(result.current).toHaveLength(1);

    rerender({current: stats("2026-10-04T10:00:05Z", 30)});
    expect(result.current.map((sample) => sample.cpu)).toEqual([10, 30]);
    expect(result.current[1]).toMatchObject({memory: 25, disk: 50});
  });

  it("keeps what it has when there is nothing to sample", () => {
    const {result, rerender} = renderHook<
      StatsSample[],
      {current: VmStats | null}
    >(({current}) => useStatsSamples(current), {
      initialProps: {current: stats("2026-10-04T10:00:00Z", 10)},
    });

    rerender({current: null});

    expect(result.current).toHaveLength(1);
  });

  it("starts with none for a VM that was never sampled", () => {
    const {result} = renderHook(() =>
      useStatsSamples(stats("0001-01-01T00:00:00Z", 0)),
    );

    expect(result.current).toEqual([]);
  });
});
