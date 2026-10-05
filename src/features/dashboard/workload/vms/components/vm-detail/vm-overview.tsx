"use client";

import {type ReactNode} from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Code,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import {IconExternalLink, IconInfoCircle} from "@tabler/icons-react";
import {useI18n} from "@/i18n/provider";
import {isGregorianStartDateTime} from "@/lib/date-and-time";
import {stateLabel} from "@/lib/state-label";
import {VmStateBadge} from "../vm-state-badge";
import {formatDateTime} from "../../lib/lifetime";
import {hasStats, type StatsSample} from "../../lib/stats";
import {formatBytes, formatNumber} from "../../lib/units";
import {type Vm} from "../../types";
import {VmExpiry} from "../vm-expiry";
import {VmKindBadge} from "../vm-kind-badge";
import {VmOwner} from "../vm-owner";
import {VmStats} from "./vm-stats";

type Props = {
  vm: Vm;

  /** The samples kept while the page has been open. */
  samples: StatsSample[];

  /** Whether whose it is is worth saying: not to its owner. */
  showOwner: boolean;
};

/** A VM at a glance: where it is, what it is using, and how it is set up. */
export function VmOverview({vm, samples, showOwner}: Props) {
  const {t, locale} = useI18n();
  const running = vm.state === "running";

  // the workload's word for why, said in the reader's when there are words
  // for it, and as it was said otherwise.
  const reason = vm.reason ? stateLabel(t, "vms.reasons", vm.reason) : null;

  return (
    <Stack>
      {running && hasStats(vm.stats) ? (
        <VmStats vm={vm} stats={vm.stats} samples={samples} />
      ) : (
        <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
          {running ? t("vms.stats.none") : t("vms.stats.notRunning")}
        </Alert>
      )}

      <Paper withBorder p="md">
        <SimpleGrid cols={{base: 1, md: 2}} spacing="lg" verticalSpacing="md">
          <Field label={t("vms.detail.state")}>
            <Stack gap={4}>
              <Group gap="xs">
                <VmStateBadge
                  state={vm.state}
                  expectedState={vm.expected_state}
                />
              </Group>
              {reason && (
                <Text size="sm" c={vm.state === "failed" ? "red" : "dimmed"}>
                  {reason}
                </Text>
              )}
            </Stack>
          </Field>

          <Field label={t("vms.detail.addresses")}>
            <Addresses vm={vm} />
          </Field>

          <Field label={t("vms.detail.kind")}>
            <Group gap="xs">
              <VmKindBadge kind={vm.kind} />
              <Code>{vm.image}</Code>
            </Group>
          </Field>

          <Field label={t("vms.detail.resources")}>
            <Text size="sm">
              {t("vms.detail.resourcesValue", {
                cpus: t("vms.units.cpus", {
                  count: formatNumber(vm.resources.cpus, locale),
                }),
                memory: formatBytes(vm.resources.memory, locale),
                disk: formatBytes(vm.resources.disk, locale),
              })}
            </Text>
          </Field>

          <Field label={t("vms.detail.network")}>
            <Group gap="xs">
              <Access
                label={t("vms.detail.ingress")}
                allowed={vm.network?.ingress === "allow"}
              />
              <Access
                label={t("vms.detail.egress")}
                allowed={vm.network?.egress === "allow"}
              />
            </Group>
          </Field>

          <Field label={t("vms.detail.disk")}>
            <Text size="sm">
              {vm.persistent_disk
                ? t("vms.detail.persistentDisk")
                : t("vms.detail.ephemeralDisk")}
            </Text>
          </Field>

          <Field label={t("vms.detail.expires")}>
            <VmExpiry vm={vm} />
          </Field>

          {showOwner && (
            <Field label={t("vms.detail.owner")}>
              <VmOwner vm={vm} />
            </Field>
          )}

          {vm.node_name && (
            <Field label={t("vms.detail.node")}>
              <Code>{vm.node_name}</Code>
            </Field>
          )}

          <Field label={t("vms.detail.createdAt")}>
            <Text size="sm">{formatDateTime(vm.created_at, locale)}</Text>
          </Field>

          {vm.started_at && !isGregorianStartDateTime(vm.started_at) && (
            <Field label={t("vms.detail.startedAt")}>
              <Text size="sm">{formatDateTime(vm.started_at, locale)}</Text>
            </Field>
          )}
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}

/** Where its ports are served, while anything may reach them. */
function Addresses({vm}: {vm: Vm}) {
  const {t} = useI18n();

  if (vm.network?.ingress !== "allow") {
    return (
      <Text size="sm" c="dimmed">
        {t("vms.detail.ingressDenied")}
      </Text>
    );
  }

  const urls = vm.urls ?? [];
  if (urls.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {(vm.ports ?? []).length === 0
          ? t("vms.detail.noPorts")
          : t("vms.detail.noAddressesYet")}
      </Text>
    );
  }

  return (
    <Stack gap={2}>
      {urls.map((url) => (
        <Group key={url.port} gap={6} wrap="nowrap">
          <Badge variant="light" color="gray" size="sm">
            {url.port}
          </Badge>
          <Anchor
            href={url.url}
            target="_blank"
            rel="noreferrer"
            size="sm"
            dir="ltr"
          >
            <Group gap={4} wrap="nowrap" component="span">
              {url.url.replace(/^https?:\/\//, "")}
              <IconExternalLink size={14} aria-hidden />
            </Group>
          </Anchor>
        </Group>
      ))}
    </Stack>
  );
}

function Access({label, allowed}: {label: string; allowed: boolean}) {
  const {t} = useI18n();

  return (
    <Badge variant="light" color={allowed ? "green" : "gray"}>
      {t(allowed ? "vms.detail.allowed" : "vms.detail.denied", {label})}
    </Badge>
  );
}

function Field({label, children}: {label: string; children: ReactNode}) {
  return (
    <Box>
      <Text size="sm" c="dimmed" mb={4}>
        {label}
      </Text>
      {children}
    </Box>
  );
}
