"use client";

import {type ReactNode} from "react";
import {Box, Group, Paper, Progress, Text} from "@mantine/core";
import {IconAlertTriangle} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {useNow} from "@/features/dashboard/workload/vms/hooks/use-now";
import {
  formatDuration,
  formatTime,
} from "@/features/dashboard/workload/vms/lib/lifetime";
import {formatNumber} from "@/features/dashboard/workload/vms/lib/units";
import {formatPercent, type Severity, severityOf} from "../../lib/usage";
import {Sparkline} from "../sparkline";

// the meter's fill says how worried to be; its track is a lighter step of the
// same colour, so the whole bar reads as one state. Never colour alone: a
// worrying share also says so in words, beside an icon.
const SEVERITY_COLORS: Record<Severity, string> = {
  normal: "blue",
  warning: "orange",
  critical: "red",
};

type Props = {
  label: string;

  /** What it is now, written large. */
  value: string;
  detail?: ReactNode;

  /**
   * A share of a limit, from 0 to 100, when there is a limit: drawn as a
   * meter, and what says how worried to be.
   */
  percent?: number;

  /** How it has gone, oldest first, and when each sample was taken. */
  trend: number[];
  times: string[];
  formatValue: (value: number) => string;
};

/**
 * One thing something is using: what it is now as a figure, a meter against
 * its limit when it has one, and how it has gone while the page has been open.
 * A VM's CPU, memory and disk are these, and so is what a container uses.
 */
export function UsageTile({
  label,
  value,
  detail,
  percent,
  trend,
  times,
  formatValue,
}: Props) {
  const {t, locale} = useI18n();
  const now = useNow(5_000);

  const severity = percent === undefined ? "normal" : severityOf(percent);
  const color = SEVERITY_COLORS[severity];

  const first = times[0];
  const caption =
    trend.length > 1 && first
      ? t("workload.usage.since", {
          span: formatDuration(
            (now - new Date(first).getTime()) / 1000,
            locale,
          ),
        })
      : t("workload.usage.collecting");

  const summary =
    trend.length > 0
      ? t("workload.usage.trend", {
          label,
          low: formatValue(Math.min(...trend)),
          high: formatValue(Math.max(...trend)),
          now: formatValue(trend[trend.length - 1]),
          count: formatNumber(trend.length, locale),
        })
      : label;

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Text size="sm" c="dimmed">
          {label}
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
              {t(`workload.usage.${severity}`)}
            </Text>
          </Group>
        )}
      </Group>

      <Text fw={600} fz={26} lh={1.25}>
        {value}
      </Text>
      {detail && (
        <Text size="xs" c="dimmed">
          {detail}
        </Text>
      )}

      {percent !== undefined && (
        <Progress.Root
          size="sm"
          mt="sm"
          style={{backgroundColor: `var(--mantine-color-${color}-light)`}}
        >
          <Progress.Section
            value={percent}
            color={color}
            aria-label={t("workload.usage.used", {
              label,
              percent: formatPercent(percent, locale),
            })}
          />
        </Progress.Root>
      )}

      <Box mt="sm">
        <Sparkline
          values={trend}
          times={times}
          color={`var(--mantine-color-${color}-filled)`}
          caption={caption}
          summary={summary}
          formatValue={formatValue}
          formatTime={(at) => formatTime(at, locale)}
        />
      </Box>
    </Paper>
  );
}
