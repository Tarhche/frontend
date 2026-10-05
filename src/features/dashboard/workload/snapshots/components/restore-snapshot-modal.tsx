"use client";

import {useState, useTransition} from "react";
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconAlertTriangle} from "@tabler/icons-react";
import {useQueryClient} from "@tanstack/react-query";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {useI18n} from "@/i18n/provider";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {restoreVm} from "@/features/dashboard/workload/vms/actions/vm-commands";
import {
  useVmChoices,
  vmKeys,
} from "@/features/dashboard/workload/vms/hooks/queries";
import {canRestore} from "@/features/dashboard/workload/vms/lib/state";
import {formatBytes} from "@/features/dashboard/workload/vms/lib/units";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {snapshotKeys} from "../hooks/queries";
import {type Snapshot} from "../types";

/** What a restore needs to know about the VM it replaces the disk of. */
export type RestoreTarget = Pick<
  Vm,
  "uuid" | "name" | "kind" | "state" | "resources" | "owner_uuid"
>;

type Props = {
  snapshot: Pick<Snapshot, "uuid" | "name" | "kind" | "disk">;
  opened: boolean;
  onClose: () => void;

  /** The routes the restore is asked through. */
  scope: Scope;

  /** The VM to restore onto, when that is decided already. */
  vm?: RestoreTarget;

  /**
   * Otherwise, where the person's own VMs are listed to choose one from: their
   * own routes, or the workload's narrowed to theirs.
   */
  choose?: VmSource | null;
};

/** Why a VM cannot take a snapshot, if it cannot. */
export function unfitFor(
  vm: RestoreTarget,
  snapshot: Pick<Snapshot, "kind" | "disk">,
): "kind" | "disk" | "state" | null {
  if (vm.kind !== snapshot.kind) {
    return "kind";
  }

  if (vm.resources.disk < snapshot.disk) {
    return "disk";
  }

  return canRestore(vm.state) ? null : "state";
}

/**
 * Restores a snapshot onto a VM: the VM is stopped, its disk is replaced with
 * the snapshot's, and it is started again. What was on its disk is gone, so
 * that is said before it is done.
 */
export function RestoreSnapshotModal({
  snapshot,
  opened,
  onClose,
  scope,
  vm,
  choose,
}: Props) {
  const {t, locale} = useI18n();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // the person's own VMs of the snapshot's kind, read when there is a choice
  // to make and the modal is open to make it.
  const listing = useVmChoices(choose ?? null, {
    kind: snapshot.kind,
    enabled: opened && !vm,
  });

  const candidates = listing.data ?? [];

  const target = vm ?? candidates.find((one) => one.uuid === chosen) ?? null;
  const kind = t(`vms.kinds.${snapshot.kind}`);
  const size = formatBytes(snapshot.disk, locale);

  const close = () => {
    setErrors([]);
    setChosen(null);
    onClose();
  };

  const restore = () => {
    if (!target) {
      return;
    }

    startTransition(async () => {
      const answer = await restoreVm(target.uuid, snapshot.uuid, scope);

      if (!answer.ok) {
        const said = Object.values(answer.errors ?? {});
        setErrors(said.length > 0 ? said : [t("snapshots.actions.failed")]);

        return;
      }

      close();
      notifications.show({
        color: "green",
        message: t("snapshots.restore.started", {vm: target.name}),
      });
      await Promise.all([
        queryClient.invalidateQueries({queryKey: vmKeys.all}),
        queryClient.invalidateQueries({queryKey: snapshotKeys.all}),
      ]);
    });
  };

  const unfit = target ? unfitFor(target, snapshot) : null;

  return (
    <Modal
      title={t("snapshots.restore.title", {snapshot: snapshot.name})}
      opened={opened}
      onClose={close}
      centered
    >
      <Stack>
        {!vm &&
          (listing.isLoading ? (
            <Group justify="center">
              <Loader size="sm" />
            </Group>
          ) : candidates.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t("snapshots.restore.noVms", {kind})}
            </Text>
          ) : (
            <Select
              label={t("snapshots.restore.vm")}
              description={t("snapshots.restore.vmHelp", {kind, size})}
              placeholder={t("snapshots.restore.vmPlaceholder")}
              value={chosen}
              onChange={setChosen}
              data={candidates.map((one) => {
                const why = unfitFor(one, snapshot);

                return {
                  value: one.uuid,
                  label: why
                    ? t(`snapshots.restore.unfit.${why}`, {name: one.name})
                    : one.name,
                  disabled: why !== null,
                };
              })}
            />
          ))}

        {target && unfit === null && (
          <Alert
            variant="light"
            color="orange"
            icon={<IconAlertTriangle />}
            title={t("snapshots.restore.warningTitle")}
          >
            {t("snapshots.restore.confirm", {
              snapshot: snapshot.name,
              vm: target.name,
            })}
          </Alert>
        )}

        {target && unfit !== null && (
          <Text size="sm" c="red">
            {t(`snapshots.restore.unfit.${unfit}`, {name: target.name})}
          </Text>
        )}

        <ValidationErrorsAlert errors={errors} />

        <Group justify="flex-end">
          <Button color="gray" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button
            color="orange"
            loading={pending}
            disabled={!target || unfit !== null}
            onClick={restore}
          >
            {t("snapshots.restore.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
