"use client";

import {
  EmptyState,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import {IconAlertTriangle, IconChartLine} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {
  formatBytes,
  formatNumber,
  formatPercent,
  formatTime,
} from "../../format";
import {
  MAX_SAMPLES,
  ratesOf,
  STATS_EVERY,
  useContainerStats,
} from "../../hooks/use-container-stats";
import {type ContainerStats, type Scope} from "../../types";
import {ProblemAlert} from "../problem-alert";
import {Sparkline} from "./sparkline";
import classes from "./container-stats.module.css";

type Severity = "ok" | "warning" | "danger";

/** How close to its limit something is: past seven tenths is worth a look. */
export function severityOf(ratio: number): Severity {
  if (ratio >= 0.9) {
    return "danger";
  }

  return ratio >= 0.7 ? "warning" : "ok";
}

type MeterProps = {
  ratio: number;
  label: string;
  valueText: string;
};

/** A share of a limit: how much of the bar is filled, and in which colour. */
function Meter({ratio, label, valueText}: MeterProps) {
  const share = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share * 100)}
      aria-valuetext={valueText}
      className={`${classes.meter} ${classes[severityOf(share)]}`}
    >
      <div className={classes.fill} style={{width: `${share * 100}%`}} />
    </div>
  );
}

type TileProps = {
  label: string;
  value: string;
  detail?: string;

  /** a share of a limit, drawn as a meter, when there is a limit. */
  ratio?: number;
  trend: number[];
  times: string[];
  format: (value: number) => string;
};

/**
 * One of the numbers, with what it is now written large and how it has gone
 * drawn under it. A meter's colour says how close to its limit it is, and an
 * icon says so too, since a colour alone says nothing to some.
 */
function Tile({label, value, detail, ratio, trend, times, format}: TileProps) {
  const {t, locale} = useI18n();
  const severity = ratio === undefined ? "ok" : severityOf(ratio);

  const summary =
    trend.length > 0
      ? t("containers.stats.trend", {
          low: format(Math.min(...trend)),
          high: format(Math.max(...trend)),
          now: format(trend[trend.length - 1]),
        })
      : "";

  return (
    <Paper withBorder p="md" className={classes.tile}>
      <Stack gap={6}>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Group gap={6} wrap="nowrap">
          {severity !== "ok" && (
            <IconAlertTriangle
              size={18}
              aria-label={t(`containers.stats.${severity}`)}
              color={
                severity === "danger"
                  ? "var(--mantine-color-red-filled)"
                  : "var(--mantine-color-yellow-filled)"
              }
            />
          )}
          <Text fw={600} size="xl" className={classes.value}>
            {value}
          </Text>
        </Group>
        {detail && (
          <Text size="xs" c="dimmed">
            {detail}
          </Text>
        )}
        {ratio !== undefined && (
          <Meter ratio={ratio} label={label} valueText={value} />
        )}
        <Sparkline
          values={trend}
          times={times}
          label={label}
          summary={summary}
          format={format}
          formatTime={(at) => formatTime(at, locale)}
        />
      </Stack>
    </Paper>
  );
}

type Props = {
  scope: Scope;
  vmUuid: string;
  id: string;
  running: boolean;

  /** the vCPUs of the VM, all of which together are a hundred percent. */
  vmCpus?: number;
};

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
  const {samples, problem, loading} = useContainerStats(
    scope,
    vmUuid,
    id,
    running,
  );

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
    if (problem && !loading) {
      return (
        <ProblemAlert problem={problem} title={t("containers.stats.failed")} />
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

  const latest: ContainerStats = samples[samples.length - 1];
  const times = samples.map((sample) => sample.sampled_at);

  const bytes = (value: number) => formatBytes(value, locale);
  const perSecond = (value: number) =>
    t("containers.stats.perSecond", {value: formatBytes(value, locale)});
  const percent = (value: number) => formatPercent(value, locale);
  const count = (value: number) => formatNumber(value, locale);

  // a rate needs two samples, so its trend starts one sample later.
  const rate = (counter: (sample: ContainerStats) => number) => {
    const rates = ratesOf(samples, counter);

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
          seconds: STATS_EVERY / 1000,
          minutes: (MAX_SAMPLES * STATS_EVERY) / 60_000,
          at: formatTime(latest.sampled_at, locale),
        })}
      </Text>

      {problem && (
        <ProblemAlert
          problem={problem}
          title={t("containers.stats.refreshFailed")}
        />
      )}

      <SimpleGrid cols={{base: 1, sm: 2, lg: 4}}>
        <Tile
          label={t("containers.stats.cpu")}
          value={percent(latest.cpu_percent)}
          detail={
            vmCpus
              ? t("containers.stats.ofVmCpus", {cpus: vmCpus})
              : t("containers.stats.ofVm")
          }
          ratio={latest.cpu_percent / 100}
          trend={samples.map((sample) => sample.cpu_percent)}
          times={times}
          format={percent}
        />
        <Tile
          label={t("containers.stats.memory")}
          value={bytes(latest.memory_used)}
          detail={
            latest.memory_limit > 0
              ? t("containers.stats.ofLimit", {
                  limit: bytes(latest.memory_limit),
                })
              : t("containers.stats.noLimit")
          }
          ratio={
            latest.memory_limit > 0
              ? latest.memory_used / latest.memory_limit
              : undefined
          }
          trend={samples.map((sample) => sample.memory_used)}
          times={times}
          format={bytes}
        />
        <Tile
          label={t("containers.stats.networkIn")}
          value={received.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.network_rx),
          })}
          trend={received.rates}
          times={received.times}
          format={perSecond}
        />
        <Tile
          label={t("containers.stats.networkOut")}
          value={sent.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.network_tx),
          })}
          trend={sent.rates}
          times={sent.times}
          format={perSecond}
        />
        <Tile
          label={t("containers.stats.diskRead")}
          value={read.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.block_read),
          })}
          trend={read.rates}
          times={read.times}
          format={perSecond}
        />
        <Tile
          label={t("containers.stats.diskWrite")}
          value={written.now}
          detail={t("containers.stats.total", {
            value: bytes(latest.block_write),
          })}
          trend={written.rates}
          times={written.times}
          format={perSecond}
        />
        <Tile
          label={t("containers.stats.pids")}
          value={count(latest.pids)}
          trend={samples.map((sample) => sample.pids)}
          times={times}
          format={count}
        />
      </SimpleGrid>
    </Stack>
  );
}
