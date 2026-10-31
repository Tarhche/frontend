"use client";

import {useId, useState, type ReactNode} from "react";
import {
  ActionIcon,
  Button,
  Code,
  Collapse,
  CopyButton,
  DataList,
  DataListItem,
  DataListItemLabel,
  DataListItemValue,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {IconCheck, IconCopy} from "@tabler/icons-react";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {formatDateTime} from "@/features/dashboard/workload/vms/lib/lifetime";
import {stateLabel} from "@/lib/state-label";
import {type Container} from "../../types";
import {ContainerPorts} from "../containers-table/container-ports";

function Item({label, children}: {label: string; children: ReactNode}) {
  return (
    <DataListItem>
      <DataListItemLabel>{label}</DataListItemLabel>
      <DataListItemValue>{children}</DataListItemValue>
    </DataListItem>
  );
}

function Nothing() {
  return (
    <Text size="sm" c="dimmed">
      —
    </Text>
  );
}

type Props = {
  container: Container;
  vmName: string;

  /** where its stack is shown, when it belongs to one and that is known. */
  stackHref?: string;
};

/**
 * A container as dockerd inspects it: what it runs, what it publishes, where
 * its data lives, and the rest of what docker says about it, kept as it said
 * it for whoever needs the detail.
 */
export function ContainerOverview({container, vmName, stackHref}: Props) {
  const {t, locale} = useI18n();
  const rawId = useId();
  const [raw, setRaw] = useState(false);

  const labels = Object.entries(container.labels ?? {});

  return (
    <Paper withBorder p="md">
      <Stack>
        <DataList labelWidth={180} withDivider>
          <Item label={t("containers.overview.id")}>
            <Group gap={4} wrap="nowrap">
              <Code dir="ltr" style={{wordBreak: "break-all"}}>
                {container.id}
              </Code>
              <CopyButton value={container.id}>
                {({copied, copy}) => (
                  <Tooltip
                    label={copied ? t("common.copied") : t("common.copy")}
                    withArrow
                  >
                    <ActionIcon
                      variant="subtle"
                      color={copied ? "teal" : "gray"}
                      onClick={copy}
                      aria-label={t("common.copy")}
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Item>
          <Item label={t("containers.overview.image")}>
            <Code dir="ltr">{container.image}</Code>
          </Item>
          <Item label={t("containers.overview.command")}>
            {container.command ? (
              <Code dir="ltr">{container.command}</Code>
            ) : (
              <Nothing />
            )}
          </Item>
          <Item label={t("containers.overview.vm")}>
            <Text size="sm">{vmName}</Text>
          </Item>
          <Item label={t("containers.overview.createdAt")}>
            <Text size="sm">
              {formatDateTime(container.created_at, locale) || "—"}
            </Text>
          </Item>
          <Item label={t("containers.overview.restartPolicy")}>
            <Text size="sm">
              {container.restart_policy
                ? stateLabel(
                    t,
                    "containers.restartPolicies",
                    container.restart_policy,
                  )
                : "—"}
            </Text>
          </Item>
          <Item label={t("containers.overview.ports")}>
            <ContainerPorts ports={container.ports} />
          </Item>
          <Item label={t("containers.overview.mounts")}>
            {container.mounts && container.mounts.length > 0 ? (
              <Stack gap={2}>
                {container.mounts.map((mount) => (
                  <Text
                    key={`${mount.type}-${mount.target}`}
                    size="sm"
                    ff="monospace"
                    dir="ltr"
                  >
                    {`${mount.type} ${mount.source || "—"} → ${mount.target}`}
                    {mount.read_only &&
                      ` (${t("containers.overview.readOnly")})`}
                  </Text>
                ))}
              </Stack>
            ) : (
              <Nothing />
            )}
          </Item>
          <Item label={t("containers.overview.networks")}>
            {container.networks && container.networks.length > 0 ? (
              <Text size="sm">{container.networks.join(", ")}</Text>
            ) : (
              <Nothing />
            )}
          </Item>
          <Item label={t("containers.overview.stack")}>
            {container.stack ? (
              <Group gap="xs">
                {stackHref ? (
                  <Link href={stackHref}>{container.stack}</Link>
                ) : (
                  <Text size="sm">{container.stack}</Text>
                )}
                {container.service && (
                  <Text size="sm" c="dimmed">
                    {t("containers.table.service", {
                      service: container.service,
                    })}
                  </Text>
                )}
              </Group>
            ) : (
              <Nothing />
            )}
          </Item>
          <Item label={t("containers.overview.labels")}>
            {labels.length > 0 ? (
              <Stack gap={2}>
                {labels.map(([key, value]) => (
                  <Text key={key} size="xs" ff="monospace" dir="ltr">
                    {`${key}=${value}`}
                  </Text>
                ))}
              </Stack>
            ) : (
              <Nothing />
            )}
          </Item>
        </DataList>

        <div>
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={() => setRaw((showing) => !showing)}
            aria-expanded={raw}
            aria-controls={rawId}
          >
            {raw
              ? t("containers.overview.hideRaw")
              : t("containers.overview.showRaw")}
          </Button>
          <Collapse expanded={raw} id={rawId}>
            <Code
              block
              dir="ltr"
              mt="xs"
              style={{maxHeight: 480, overflow: "auto"}}
            >
              {JSON.stringify(container, null, 2)}
            </Code>
          </Collapse>
        </div>
      </Stack>
    </Paper>
  );
}
