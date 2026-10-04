"use client";

import {Badge, Group, Text} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {runtimeName} from "../../runtimes";
import classes from "./runtime-badge.module.css";

type Props = {
  /**
   * The class a task was run as, which the workload names for every task. A
   * workload with no classes yet names none, and none is guessed at.
   */
  runtime?: string;

  /** The node it was given to, which it has none of until it is placed. */
  node?: string;
};

/**
 * What a task is run as, and where. The class is shown as the workload names
 * it, since that is the name a task or a stack asks for it by. Every class is
 * drawn alike: what tells one from another is its name, and nothing here
 * knows more about a class than that.
 */
export function RuntimeBadge({runtime, node}: Props) {
  const t = useTranslations();

  const badge = runtime && (
    <Badge color="cyan" variant="dot" title={runtimeName(t, runtime)}>
      {runtime}
    </Badge>
  );

  const placed = node && (
    <Text span className={classes.node} title={t("tasks.runtime.node")}>
      {node}
    </Text>
  );

  if (badge && placed) {
    return (
      <Group gap={6} wrap="nowrap">
        {badge}
        {placed}
      </Group>
    );
  }

  return badge || placed || null;
}
