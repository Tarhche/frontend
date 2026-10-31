"use client";

import {useState, useTransition} from "react";
import {ActionIcon, ActionIconGroup, Text, Tooltip, rem} from "@mantine/core";
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
import {ConfirmModal} from "@/features/dashboard/workload/components/confirm-modal";
import {type Problem} from "@/features/dashboard/workload/lib/problem";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
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
    choose?: VmSource | null;
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
  const [problem, setProblem] = useState<Problem | null>(null);

  const ready = snapshot.state === "ready";

  // the question stays open until the answer comes, and says why when it is
  // a refusal.
  const remove_ = () => {
    if (!remove) {
      return;
    }

    setProblem(null);
    startTransition(async () => {
      const answer = await deleteSnapshot(snapshot.uuid, remove);
      if (answer.ok) {
        setOpen(null);
      } else {
        setProblem(answer.problem);
      }

      await queryClient.invalidateQueries({queryKey: snapshotKeys.all});
    });
  };

  return (
    <>
      <ActionIconGroup>
        {/* a link cannot be disabled, so one that is not ready yet is a
            button that cannot be pressed, keeping the others in line. */}
        {restoreAsNew && (
          <Tooltip label={t("snapshots.actions.restoreAsNew")} withArrow>
            {ready ? (
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
            ) : (
              <ActionIcon
                variant="light"
                size="lg"
                color="teal"
                disabled
                aria-label={t("snapshots.actions.restoreAsNew")}
              >
                <IconCopyPlus style={{width: rem(20)}} stroke={1.5} />
              </ActionIcon>
            )}
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
              disabled={snapshot.state === "deleting" || pending}
              aria-label={t("snapshots.actions.delete")}
              onClick={() => {
                setProblem(null);
                setOpen("delete");
              }}
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
        onClose={() => setOpen(null)}
        onConfirm={remove_}
        loading={pending}
        problem={problem}
        confirmLabel={t("common.delete")}
      >
        <Text>
          {t("snapshots.actions.deleteConfirm", {name: snapshot.name})}
        </Text>
      </ConfirmModal>
    </>
  );
}
