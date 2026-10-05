"use client";

import {useId, useState, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {
  Alert,
  Button,
  Code,
  Collapse,
  EmptyState,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconInfoCircle,
  IconPlayerStop,
  IconStack2,
} from "@tabler/icons-react";
import Link from "@/components/link";
import {useI18n} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {formatDate} from "@/lib/date-and-time";
import {ContainerStateBadge} from "@/features/dashboard/workload/docker/components/container-state-badge";
import {
  ContainerPorts,
  containerName,
} from "@/features/dashboard/workload/docker/components/containers-table";
import {
  ProblemAlert,
  StaleAlert,
} from "@/features/dashboard/workload/components/problem-alert";
import {TableSkeleton} from "@/features/dashboard/workload/docker/components/table-skeleton";
import {StateBadge} from "@/features/dashboard/workload/components/state-badge";
import {problemOf} from "@/features/dashboard/workload/lib/problem";
import {shortId} from "@/features/dashboard/workload/docker/format";
import {useVmChoices} from "@/features/dashboard/workload/vms/hooks/queries";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {useStack} from "../../hooks/use-stacks";
import {type StackMay} from "../../permissions";
import {type StackDetail as StackRecord} from "../../types";
import {ComposeEditor} from "../compose-editor";
import {StackActions} from "../stack-actions";
import {StackStateBadge, type StackTransition} from "../stack-state-badge";

type SectionProps = {
  title: string;
  open: boolean;
  children: ReactNode;
};

/** Something long that is kept folded until somebody wants it. */
function Folded({title, open: openFirst, children}: SectionProps) {
  const {t} = useI18n();
  const id = useId();
  const [open, setOpen] = useState(openFirst);

  return (
    <Paper withBorder p="md">
      <Group justify="space-between">
        <Text fw={500}>{title}</Text>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
          aria-controls={id}
        >
          {open ? t("stacks.detail.hide") : t("stacks.detail.show")}
        </Button>
      </Group>
      <Collapse expanded={open} id={id}>
        <div style={{paddingTop: "var(--mantine-spacing-sm)"}}>{children}</div>
      </Collapse>
    </Paper>
  );
}

function Containers({stack}: {stack: StackRecord}) {
  const {t} = useI18n();
  const containers = stack.containers ?? [];

  if (stack.note === "vm_not_running") {
    return (
      <EmptyState
        icon={<IconPlayerStop />}
        withIndicatorBackground
        title={t("stacks.detail.vmNotRunningTitle")}
        description={t("stacks.detail.vmNotRunning")}
      />
    );
  }

  return (
    <TableScrollContainer minWidth={760}>
      <Table verticalSpacing="sm" striped withRowBorders>
        <TableThead>
          <TableTr>
            <TableTh>{t("stacks.detail.container")}</TableTh>
            <TableTh>{t("stacks.detail.service")}</TableTh>
            <TableTh>{t("containers.table.image")}</TableTh>
            <TableTh>{t("containers.table.state")}</TableTh>
            <TableTh>{t("containers.table.status")}</TableTh>
            <TableTh>{t("containers.table.ports")}</TableTh>
          </TableTr>
        </TableThead>
        <TableTbody>
          {containers.length === 0 && (
            <TableTr>
              <TableTd colSpan={6} ta="center">
                {t("stacks.detail.noContainers")}
              </TableTd>
            </TableTr>
          )}
          {containers.map((container) => (
            <TableTr key={container.id}>
              <TableTd>
                <Link
                  href={APP_PATHS.dashboard.containers.detail(
                    container.vm_uuid ?? stack.vm_uuid,
                    container.id,
                  )}
                >
                  {containerName(container)}
                </Link>
              </TableTd>
              <TableTd>
                <Text size="sm">{container.service ?? "—"}</Text>
              </TableTd>
              <TableTd>
                <Text size="sm" ff="monospace" dir="ltr">
                  {container.image}
                </Text>
              </TableTd>
              <TableTd>
                <ContainerStateBadge
                  state={container.state}
                  status={container.status}
                />
              </TableTd>
              <TableTd>
                <Text size="sm">{container.status}</Text>
              </TableTd>
              <TableTd>
                <ContainerPorts ports={container.ports} />
              </TableTd>
            </TableTr>
          ))}
        </TableTbody>
      </Table>
    </TableScrollContainer>
  );
}

type Props = {
  scope: Scope;
  uuid: string;
  may: StackMay;

  /** where the VM it is in is listed, for its name and state. */
  vmSource: VmSource | null;
};

/**
 * One stack: where it is, what its last compose command left it as and said,
 * and the containers it has now. There is no editing it; it is started,
 * stopped, restarted or deleted, and a different compose file is a new stack.
 */
export function StackDetail({scope, uuid, may, vmSource}: Props) {
  const {t, locale} = useI18n();
  const router = useRouter();
  const query = useStack(scope, uuid);
  const vms = useVmChoices(vmSource, {kind: "docker"});
  const [pending, setPending] = useState<StackTransition | undefined>();

  if (query.isPending) {
    return (
      <Stack>
        <Skeleton height={34} width={260} />
        <TableSkeleton rows={3} />
      </Stack>
    );
  }

  if (!query.data) {
    const problem = problemOf(query.error);

    if (problem.status === 404 || problem.code === "not_found") {
      return (
        <EmptyState
          icon={<IconStack2 />}
          withIndicatorBackground
          title={t("stacks.detail.goneTitle")}
          description={t("stacks.detail.gone")}
        >
          <Group justify="center" mt="md">
            <Button
              component={Link}
              href={APP_PATHS.dashboard.stacks.index}
              variant="light"
            >
              {t("stacks.detail.backToList")}
            </Button>
          </Group>
        </EmptyState>
      );
    }

    return (
      <ProblemAlert
        problem={problem}
        title={t("stacks.detail.failed")}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }

  const stack = query.data;
  const vm = vms.data?.find((each) => each.uuid === stack.vm_uuid);
  const failed = stack.state === "failed";

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group gap="sm">
            <Title order={2}>{stack.name}</Title>
            <StackStateBadge state={stack.state} pending={pending} />
          </Group>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {t("stacks.detail.inVm", {
                vm: vm?.name ?? stack.vm_name ?? shortId(stack.vm_uuid),
              })}
            </Text>
            {vm && (
              <StateBadge state={vm.state} expectedState={vm.expected_state} />
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {t("stacks.detail.project", {slug: stack.slug})}
            {" · "}
            {t("stacks.detail.createdAt", {
              date: formatDate(stack.created_at, locale),
            })}
          </Text>
        </Stack>
        <StackActions
          scope={scope}
          stack={stack}
          may={may}
          onPending={setPending}
          onDeleted={() => router.push(APP_PATHS.dashboard.stacks.index)}
        />
      </Group>

      {query.isError && (
        <StaleAlert
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      )}

      {stack.reason && (
        <Alert
          color={failed ? "red" : "blue"}
          variant="light"
          icon={failed ? <IconAlertTriangle /> : <IconInfoCircle />}
          title={t("stacks.detail.reason")}
          role={failed ? "alert" : "status"}
        >
          {stack.reason}
        </Alert>
      )}

      {stack.output && (
        <Folded title={t("stacks.detail.output")} open={failed}>
          <Code
            block
            dir="ltr"
            style={{maxHeight: 420, overflow: "auto", whiteSpace: "pre-wrap"}}
          >
            {stack.output}
          </Code>
        </Folded>
      )}

      {stack.compose && (
        <Folded title={t("stacks.detail.compose")} open={false}>
          <ComposeEditor value={stack.compose} readOnly height={240} />
        </Folded>
      )}

      <Stack gap="xs">
        <Title order={4}>{t("stacks.detail.containers")}</Title>
        <Containers stack={stack} />
      </Stack>
    </Stack>
  );
}
