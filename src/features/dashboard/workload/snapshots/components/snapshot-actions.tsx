"use client";

import {useState, useTransition} from "react";
import {ActionIcon, ActionIconGroup, Tooltip, rem} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {
  IconCopyPlus,
  IconPencil,
  IconRestore,
  IconTrash,
} from "@tabler/icons-react";
import {useQueryClient} from "@tanstack/react-query";
import Link from "@/components/link";
import {useTranslations} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {ConfirmModal} from "@/features/dashboard/workload/vms/components/confirm-modal";
import {deleteSnapshot} from "../actions/snapshot-commands";
import {snapshotKeys} from "../hooks/queries";
import {type Snapshot} from "../types";
import {RenameSnapshotModal} from "./rename-snapshot-modal";
import {
  RestoreSnapshotModal,
  type RestoreTarget,
} from "./restore-snapshot-modal";

type Props = {
  snapshot: Snapshot;

  /** The routes it is renamed and deleted through; null where it may not be. */
  rename: Scope | null;
  remove: Scope | null;

  /** Whether it may be restored as a new VM: it is one's own. */
  restoreAsNew?: boolean;

  /**
   * How it is restored onto a VM, if it may be: onto the one given, or onto
   * one the person chooses from their own.
   */
  restore?: {
    scope: Scope;
    vm?: RestoreTarget;
    choose?: {scope: Scope; me: string | null};
  } | null;
};

/** What can be done with a snapshot. */
export function SnapshotActions({
  snapshot,
  rename,
  remove,
  restoreAsNew = false,
  restore = null,
}: Props) {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<"rename" | "restore" | "delete" | null>(
    null,
  );

  const ready = snapshot.state === "ready";

  const remove_ = () => {
    if (!remove) {
      return;
    }

    setOpen(null);
    startTransition(async () => {
      const answer = await deleteSnapshot(snapshot.uuid, remove);
      if (!answer.ok) {
        notifications.show({
          color: "red",
          title: t("errors.errorTitle"),
          message: t("snapshots.actions.failed"),
        });
      }

      await queryClient.invalidateQueries({queryKey: snapshotKeys.all});
    });
  };

  return (
    <>
      <ActionIconGroup>
        {/* a link cannot be disabled, so one that is not ready has none. */}
        {restoreAsNew && ready && (
          <Tooltip label={t("snapshots.actions.restoreAsNew")} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              color="teal"
              component={Link}
              href={APP_PATHS.dashboard.vms.restore(snapshot.uuid)}
              aria-label={t("snapshots.actions.restoreAsNew")}
            >
              <IconCopyPlus style={{width: rem(20)}} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
        {restore && (
          <Tooltip
            label={
              restore.vm
                ? t("snapshots.actions.restoreOntoThis")
                : t("snapshots.actions.restoreOnto")
            }
            withArrow
          >
            <ActionIcon
              variant="light"
              size="lg"
              color="orange"
              disabled={!ready}
              aria-label={
                restore.vm
                  ? t("snapshots.actions.restoreOntoThis")
                  : t("snapshots.actions.restoreOnto")
              }
              onClick={() => setOpen("restore")}
            >
              <IconRestore style={{width: rem(20)}} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
        {rename && (
          <Tooltip label={t("snapshots.actions.rename")} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              color="blue"
              disabled={snapshot.state === "deleting"}
              aria-label={t("snapshots.actions.rename")}
              onClick={() => setOpen("rename")}
            >
              <IconPencil style={{width: rem(20)}} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
        {remove && (
          <Tooltip label={t("snapshots.actions.delete")} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              color="red"
              loading={pending}
              disabled={snapshot.state === "deleting"}
              aria-label={t("snapshots.actions.delete")}
              onClick={() => setOpen("delete")}
            >
              <IconTrash style={{width: rem(20)}} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )}
      </ActionIconGroup>

      {rename && (
        <RenameSnapshotModal
          // opened afresh each time, so it starts from the name as it is now.
          key={open === "rename" ? "renaming" : "idle"}
          snapshot={snapshot}
          scope={rename}
          opened={open === "rename"}
          onClose={() => setOpen(null)}
        />
      )}

      {restore && (
        <RestoreSnapshotModal
          snapshot={snapshot}
          scope={restore.scope}
          vm={restore.vm}
          choose={restore.choose}
          opened={open === "restore"}
          onClose={() => setOpen(null)}
        />
      )}

      <ConfirmModal
        opened={open === "delete"}
        message={t("snapshots.actions.deleteConfirm", {name: snapshot.name})}
        confirmLabel={t("common.delete")}
        onConfirm={remove_}
        onCancel={() => setOpen(null)}
      />
    </>
  );
}
