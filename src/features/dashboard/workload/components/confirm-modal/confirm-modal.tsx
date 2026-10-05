"use client";

import {type ReactNode} from "react";
import {Button, Group, Modal, Stack} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {type Problem} from "../../lib/problem";
import {ProblemAlert} from "../problem-alert";

type Props = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;

  /** what is about to happen, and anything that has to be decided about it. */
  children: ReactNode;
  confirmLabel: string;
  confirmColor?: string;

  /** what turning it down is called, when it is more than cancelling. */
  cancelLabel?: string;
  loading?: boolean;

  /** why the last attempt did not go through, said where it was asked for. */
  problem?: Problem | null;
};

/**
 * Asks before doing something that cannot be taken back, or that interrupts
 * whatever is running. The question stays open until the answer comes, so a
 * refusal is said where it was asked rather than somewhere else on the page.
 *
 * Each question is a modal of its own where there are several: a modal that
 * has been closed is still on screen while it fades away, so one modal asking
 * whichever question is current turns into the next one on the way out.
 */
export function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  children,
  confirmLabel,
  confirmColor = "red",
  cancelLabel,
  loading = false,
  problem,
}: Props) {
  const t = useTranslations();

  return (
    <Modal
      title={t("common.confirmAction")}
      opened={opened}
      size="md"
      centered
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <Stack gap="md">
        {children}
        {problem && <ProblemAlert problem={problem} />}
        <Group justify="flex-end">
          <Button color="gray" onClick={onClose} disabled={loading}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button color={confirmColor} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
