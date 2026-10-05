"use client";

import {EmptyState, SimpleGrid, Skeleton, Stack, Text} from "@mantine/core";
import {IconChartLine} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {UsageTile} from "@/features/dashboard/workload/components/usage-tile";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {
  clampPercent,
  formatPercent,
  MAX_SAMPLES,
  percentOf,
  ratesOf,
} from "@/features/dashboard/workload/lib/usage";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {POLL_MS} from "@/features/dashboard/workload/vms/hooks/queries";
import {formatTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {
  formatBytes,
  formatNumber,
} from "@/features/dashboard/workload/vms/lib/units";
import {useContainerStats} from "../../hooks/use-container-stats";
import {type ContainerStats} from "../../types";

type Props = {
  scope: Scope;
  vmUuid: string;
  id: string;
  running: boolean;

  /** the vCPUs of the VM, all of which together are a hundred percent. */
  vmCpus?: number;
};

const sampledAt = (sample: ContainerStats) => sample.sampled_at;

/**
 * What a running container is using, sampled every few seconds while this is
 * open. CPU and memory are shares of a limit, so they are meters; network and
 * disk are counters, so what they show is how fast they are going, with what
 * they have come to beside it.
 */
export function ContainerStatsPanel({
  scope,
  vmUuid,
  id,
  running,
  vmCpus,
}: Props) {
  const {t, locale} = useI18n();
  const {samples, query} = useContainerStats(scope, vmUuid, id, running);

  if (!running) {
    return (
      <EmptyState
        icon={<IconChartLine />}
        withIndicatorBackground
        title={t("containers.stats.notRunningTitle")}
        description={t("containers.stats.notRunning")}
      />
    );
  }

  if (samples.length === 0) {
    if (query.isError) {
      return (
        <ProblemAlert
          problem={problemOf(query.error)}
          title={t("containers.stats.failed")}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      );
    }

    return (
      <SimpleGrid cols={{base: 1, sm: 2, lg: 4}}>
        {Array.from({length: 4}).map((_, index) => (
          <Skeleton key={index} height={150} radius="md" />
        ))}
      </SimpleGrid>
    );
  }

  const latest = samples[samples.length - 1];
  const times = samples.map(sampledAt);

  const bytes = (value: number) => formatBytes(value, locale);
  const perSecond = (value: number) =>
    t("containers.stats.perSecond", {value: formatBytes(value, locale)});
  const percent = (value: number) => formatPercent(value, locale);
  const count = (value: number) => formatNumber(value, locale);

  // a rate needs two samples, so its trend starts one sample later.
  const rate = (counter: (sample: ContainerStats) => number) => {
    const rates = ratesOf(samples, counter, sampledAt, POLL_MS / 1000);

    return {
      rates,
      times: times.slice(1),
      now: rates.length > 0 ? perSecond(rates[rates.length - 1]) : "—",
    };
  };

  const received = rate((sample) => sample.network_rx);
  const sent = rate((sample) => sample.network_tx);
  const read = rate((sample) => sample.block_read);
  const written = rate((sample) => sample.block_write);

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t("containers.stats.help", {
          seconds: count(POLL_MS / 1000),
          minutes: count((MAX_SAMPLES * POLL_MS) / 60_000),
          at: formatTime(latest.sampled_at, locale),
        })}
      </Text>

      {query.isError && (
        <StaleAlert
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}

      <SimpleGrid cols={{base: 1, sm: 2, lg: 4}}>
        <UsageTile
          label={t("containers.stats.cpu")}
          value={percent(latest.cpu_percent)}
          detail={
            vmCpus
              ? t("containers.stats.ofVmCpus", {cpus: count(vmCpus)})
              : t("containers.stats.ofVm")
          }
          percent={clampPercent(latest.cpu_percent)}
          trend={samples.map((sample) => sample.cpu_percent)}
          times={times}
          formatValue={percent}
        />
        <UsageTile
          label={t("containers.stats.memory")}
          value={bytes(latest.memory_used)}
          detail={
            latest.memory_limit > 0
              ? t("containers.stats.ofLimit", {
                  limit: bytes(latest.memory_limit),
                })
              : t("containers.stats.noLimit")
          }
          percent={
            latest.memory_limit > 0
              ? percentOf(latest.memory_used, latest.memory_limit)
              : undefined
          }
          trend={samples.map((sample) => sample.memory_used)}
          times={times}
          formatValue={bytes}
        />
        <UsageTile
          label={t("containers.stats.networkIn")}
          value={received.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.network_rx),
          })}
          trend={received.rates}
          times={received.times}
          formatValue={perSecond}
        />
        <UsageTile
          label={t("containers.stats.networkOut")}
          value={sent.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.network_tx),
          })}
          trend={sent.rates}
          times={sent.times}
          formatValue={perSecond}
        />
        <UsageTile
          label={t("containers.stats.diskRead")}
          value={read.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.block_read),
          })}
          trend={read.rates}
          times={read.times}
          formatValue={perSecond}
        />
        <UsageTile
          label={t("containers.stats.diskWrite")}
          value={written.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.block_write),
          })}
          trend={written.rates}
          times={written.times}
          formatValue={perSecond}
        />
        <UsageTile
          label={t("containers.stats.pids")}
          value={count(latest.pids)}
          trend={samples.map((sample) => sample.pids)}
          times={times}
          formatValue={count}
        />
      </SimpleGrid>
    </Stack>
  );
}
