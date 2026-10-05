import {render, screen} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {GiB, MiB} from "../../lib/units";
import {VmStats} from "./vm-stats";

// the tiles ask for their words in the reader's language; what this is about
// is which words, and the numbers put in them.
jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

const stats = {
  cpu_percent: 37.5,
  memory_used: 512 * MiB,
  memory_limit: 2 * GiB,
  disk_used: 18 * GiB,
  disk_total: 20 * GiB,
  network_rx: 3 * GiB,
  network_tx: 200 * MiB,
  sampled_at: "2026-10-04T10:00:05Z",
};

const samples = [
  {at: "2026-10-04T10:00:00Z", cpu: 10, memory: 20, disk: 89},
  {at: "2026-10-04T10:00:05Z", cpu: 37.5, memory: 25, disk: 90},
];

function tiles() {
  return render(
    <MantineProvider env="test">
      <VmStats
        vm={{resources: {cpus: 2, memory: 2 * GiB, disk: 20 * GiB}}}
        stats={stats}
        samples={samples}
      />
    </MantineProvider>,
  );
}

describe("VmStats", () => {
  it("reads each figure in the unit that suits it", () => {
    tiles();

    expect(screen.getByText("38%")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.ofCpus(2)")).toBeInTheDocument();
    expect(screen.getByText("512 MiB")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.of(2 GiB)")).toBeInTheDocument();
    expect(screen.getByText("18 GiB")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.of(20 GiB)")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.received(3 GiB)")).toBeInTheDocument();
    expect(screen.getByText("vms.stats.sent(200 MiB)")).toBeInTheDocument();
  });

  it("says in words, not colour alone, that a disk is nearly full", () => {
    tiles();

    expect(screen.getByText("workload.usage.critical")).toBeInTheDocument();
    expect(
      screen.queryByText("workload.usage.warning"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "workload.usage.used(vms.stats.disk,90%)",
      }),
    ).toBeInTheDocument();
  });

  it("says what each trend shows to whoever cannot see it", () => {
    tiles();

    expect(
      screen.getByRole("img", {
        name: "workload.usage.trend(vms.stats.cpu,10%,38%,38%,2)",
      }),
    ).toBeInTheDocument();
  });
});
