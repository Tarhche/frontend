"use client";

import {Badge, Group, Text} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {runtimeName, runtimeOf} from "../../runtimes";
import classes from "./runtime-badge.module.css";

type Props = {
  /**
   * The class a task was run as. One from before there were classes names
   * none, and was run as a container.
   */
  runtime?: string;

  /** The node it was given to, which it has none of until it is placed. */
  node?: string;
};

// what each class is, at a glance. One this does not know is drawn plainly.
const colors: Record<string, string> = {
  sysbox: "cyan",
  firecracker: "orange",
};

/**
 * What a task is run as, and where. The class is shown as the workload names
 * it, since that is the name a task or a stack asks for it by.
 */
export function RuntimeBadge({runtime, node}: Props) {
  const t = useTranslations();
  const name = runtimeOf(runtime);

  const badge = (
    <Badge
      color={colors[name] ?? "gray"}
      variant="dot"
      title={runtimeName(t, name)}
    >
      {name}
    </Badge>
  );

  if (!node) {
    return badge;
  }

  return (
    <Group gap={6} wrap="nowrap">
      {badge}
      <Text span className={classes.node} title={t("tasks.runtime.node")}>
        {node}
      </Text>
    </Group>
  );
}
