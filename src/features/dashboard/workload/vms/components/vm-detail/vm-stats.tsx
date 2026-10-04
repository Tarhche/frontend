"use client";

import {
  Box,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {useNow} from "../../hooks/use-now";
import {formatDuration, formatRelative} from "../../lib/lifetime";
import {
  clampPercent,
  formatPercent,
  percentOf,
  type Severity,
  severityOf,
  type StatsSample,
} from "../../lib/stats";
import {formatBytes, formatNumber} from "../../lib/units";
import {type Vm, type VmStats as Stats} from "../../types";
import {Sparkline} from "./sparkline";

// the meter's fill says how worried to be; its track is a lighter step of the
// same colour, so the whole bar reads as one state. Never colour alone: a
// worrying share also says so in words, beside an icon.
const SEVERITY_COLORS: Record<Severity, string> = {
  normal: "blue",
  warning: "orange",
  critical: "red",
};

type Tile = {
  key: "cpu" | "memory" | "disk";
  label: string;
  value: string;
  detail: string;
  percent: number;
};

/**
 * What a running VM is using: CPU, memory and disk, each as a figure, a meter
 * against what it has, and how it has gone while the page has been open.
 */
export function VmStats({
  vm,
  stats,
  samples,
}: {
  vm: Pick<Vm, "resources">;
  stats: Stats;
  samples: StatsSample[];
}) {
  const {t, locale} = useI18n();
  const now = useNow(5_000);

  const tiles: Tile[] = [
    {
      key: "cpu",
      label: t("vms.stats.cpu"),
      value: formatPercent(stats.cpu_percent, locale),
      detail: t("vms.stats.ofCpus", {
        count: formatNumber(vm.resources.cpus, locale),
      }),
      percent: clampPercent(stats.cpu_percent),
    },
    {
      key: "memory",
      label: t("vms.stats.memory"),
      value: formatBytes(stats.memory_used, locale),
      detail: t("vms.stats.of", {
        total: formatBytes(stats.memory_limit, locale),
      }),
      percent: percentOf(stats.memory_used, stats.memory_limit),
    },
    {
      key: "disk",
      label: t("vms.stats.disk"),
      value: formatBytes(stats.disk_used, locale),
      detail: t("vms.stats.of", {total: formatBytes(stats.disk_total, locale)}),
      percent: percentOf(stats.disk_used, stats.disk_total),
    },
  ];

  const times = samples.map((sample) => sample.at);
  const first = samples[0];
  const span = first
    ? formatDuration((now - new Date(first.at).getTime()) / 1000, locale)
    : "";

  const clock = (at: string) =>
    new Date(at).toLocaleTimeString(locale === "fa" ? "fa-IR" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <Stack gap="xs">
      <SimpleGrid cols={{base: 1, sm: 3}}>
        {tiles.map((tile) => {
          const severity = severityOf(tile.percent);
          const color = SEVERITY_COLORS[severity];
          const values = samples.map((sample) => sample[tile.key]);
          const low = Math.min(...values);
          const high = Math.max(...values);

          return (
            <Paper key={tile.key} withBorder p="md" radius="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Text size="sm" c="dimmed">
                  {tile.label}
                </Text>
                {severity !== "normal" && (
                  <Group gap={4} wrap="nowrap">
                    <IconAlertTriangle
                      size={14}
                      stroke={2}
                      color={`var(--mantine-color-${color}-filled)`}
                      aria-hidden
                    />
                    <Text size="xs" c="dimmed">
                      {t(`vms.stats.${severity}`)}
                    </Text>
                  </Group>
                )}
              </Group>

              <Text fw={600} fz={26} lh={1.25}>
                {tile.value}
              </Text>
              <Text size="xs" c="dimmed">
                {tile.detail}
              </Text>

              <Progress.Root
                size="sm"
                mt="sm"
                style={{backgroundColor: `var(--mantine-color-${color}-light)`}}
              >
                <Progress.Section
                  value={tile.percent}
                  color={color}
                  aria-label={t("vms.stats.used", {
                    label: tile.label,
                    percent: formatPercent(tile.percent, locale),
                  })}
                />
              </Progress.Root>

              <Box mt="sm">
                <Sparkline
                  values={values}
                  times={times}
                  color={`var(--mantine-color-${color}-filled)`}
                  caption={
                    values.length > 1
                      ? t("vms.stats.since", {span})
                      : t("vms.stats.collecting")
                  }
                  summary={t("vms.stats.trend", {
                    label: tile.label,
                    low: formatPercent(low, locale),
                    high: formatPercent(high, locale),
                    now: formatPercent(tile.percent, locale),
                    count: formatNumber(values.length, locale),
                  })}
                  formatValue={(value) => formatPercent(value, locale)}
                  formatTime={clock}
                />
              </Box>
            </Paper>
          );
        })}
      </SimpleGrid>

      <Group gap="lg" justify="space-between">
        <Group gap="md">
          <Group gap={4}>
            <IconArrowDown size={14} aria-hidden />
            <Text size="xs" c="dimmed">
              {t("vms.stats.received", {
                size: formatBytes(stats.network_rx, locale),
              })}
            </Text>
          </Group>
          <Group gap={4}>
            <IconArrowUp size={14} aria-hidden />
            <Text size="xs" c="dimmed">
              {t("vms.stats.sent", {
                size: formatBytes(stats.network_tx, locale),
              })}
            </Text>
          </Group>
        </Group>
        <Text size="xs" c="dimmed">
          {t("vms.stats.sampled", {
            when: formatRelative(
              new Date(stats.sampled_at),
              new Date(now),
              locale,
            ),
          })}
        </Text>
      </Group>
    </Stack>
  );
}
