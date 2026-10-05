"use client";

import {Group, SimpleGrid, Stack, Text} from "@mantine/core";
import {IconArrowDown, IconArrowUp} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {UsageTile} from "@/features/dashboard/workload/components/usage-tile";
import {
  clampPercent,
  formatPercent,
  percentOf,
} from "@/features/dashboard/workload/lib/usage";
import {useNow} from "../../hooks/use-now";
import {formatRelative} from "../../lib/lifetime";
import {type StatsSample} from "../../lib/stats";
import {formatBytes, formatNumber} from "../../lib/units";
import {type Vm, type VmStats as Stats} from "../../types";

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

  const times = samples.map((sample) => sample.at);
  const percent = (value: number) => formatPercent(value, locale);

  const tiles = [
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
  ] as const;

  return (
    <Stack gap="xs">
      <SimpleGrid cols={{base: 1, sm: 3}}>
        {tiles.map((tile) => (
          <UsageTile
            key={tile.key}
            label={tile.label}
            value={tile.value}
            detail={tile.detail}
            percent={tile.percent}
            trend={samples.map((sample) => sample[tile.key])}
            times={times}
            formatValue={percent}
          />
        ))}
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
