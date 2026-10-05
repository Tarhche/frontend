"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Box, Button, EmptyState, Group, Title} from "@mantine/core";
import {IconServer2} from "@tabler/icons-react";
import Link from "@/components/link";
import {useTranslations} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {StaleAlert} from "@/features/dashboard/workload/components/problem-alert";
import {VmSnapshots} from "@/features/dashboard/workload/snapshots/components/vm-snapshots";
import {snapshotScope} from "@/features/dashboard/workload/snapshots/permissions";
import {type VmTransition, VmStateBadge} from "../vm-state-badge";
import {type Scope} from "../../api";
import {useVm} from "../../hooks/queries";
import {useStatsSamples} from "../../hooks/use-stats-samples";
import {vmAbilities} from "../../permissions";
import {type Vm} from "../../types";
import {VmActions} from "../vm-actions";
import {VmKindBadge} from "../vm-kind-badge";
import {VmLogs} from "./vm-logs";
import {VmOverview} from "./vm-overview";
import {VmSettingsForm} from "./vm-settings-form";
import {VmTabs} from "./vm-tabs";
import {VmTerminal} from "./vm-terminal";

type Props = {
  /** The VM as the server rendered it. */
  initial: Vm;

  /** The routes it was read through, and is read again through. */
  scope: Scope;

  /** What the person looking holds, and who they are. */
  permissions: string[];
  me: string | null;
};

/**
 * One VM, kept current while the page is open: read every few seconds, which
 * is also what its stats are sampled from, whichever tab is showing.
 */
export function VmDetail({initial, scope, permissions, me}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const {data, isError, error, refetch, isFetching} = useVm({
    scope,
    uuid: initial.uuid,
    initialData: initial,
  });
  const [pending, setPending] = useState<VmTransition | undefined>(undefined);

  // the last VM read, until it is gone: a failed read keeps what was shown.
  const vm = data === undefined ? initial : data;
  const samples = useStatsSamples(vm?.stats);

  // gone while it was being looked at, said as a container or a stack that
  // is not there is.
  if (vm === null) {
    return (
      <EmptyState
        icon={<IconServer2 />}
        withIndicatorBackground
        title={t("vms.detail.goneTitle")}
        description={t("vms.detail.gone")}
        mt="md"
      >
        <Group justify="center" mt="md">
          <Button
            component={Link}
            href={APP_PATHS.dashboard.vms.index}
            variant="light"
          >
            {t("vms.detail.backToList")}
          </Button>
        </Group>
      </EmptyState>
    );
  }

  const isOwner = vm.owner_uuid === me;
  const may = vmAbilities(permissions, isOwner);
  const snapshots = snapshotScope(permissions, "index", isOwner);
  const running = vm.state === "running";

  return (
    <>
      <Group justify="space-between" py="md" gap="sm">
        <Group gap="sm">
          <Title order={2}>{vm.name}</Title>
          <VmKindBadge kind={vm.kind} />
          <VmStateBadge
            state={vm.state}
            expectedState={vm.expected_state}
            pending={pending}
          />
        </Group>
        <VmActions
          vm={vm}
          manage={may.manage}
          remove={may.delete}
          onPending={setPending}
          onDeleted={() => router.push(APP_PATHS.dashboard.vms.index)}
          variant="buttons"
        />
      </Group>

      {isError && (
        <Box mb="sm">
          <StaleAlert
            error={error}
            onRetry={() => void refetch()}
            retrying={isFetching}
          />
        </Box>
      )}

      <VmTabs
        hasSession={may.attach && running}
        overview={<VmOverview vm={vm} samples={samples} showOwner={!isOwner} />}
        terminal={
          may.attach ? <VmTerminal uuid={vm.uuid} running={running} /> : null
        }
        logs={may.logs ? <VmLogs scope={may.logs} uuid={vm.uuid} /> : null}
        snapshots={
          snapshots ? (
            <VmSnapshots
              vm={vm}
              scope={snapshots}
              permissions={permissions}
              me={me}
              canTake={may.snapshot}
              restore={may.manage}
            />
          ) : null
        }
        settings={
          may.update ? <VmSettingsForm vm={vm} scope={may.update} /> : null
        }
      />
    </>
  );
}
