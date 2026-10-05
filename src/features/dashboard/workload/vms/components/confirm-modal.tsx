"use client";

import {type ReactNode} from "react";
import {Button, Group, Modal, Text} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";

type Props = {
  opened: boolean;
  message: ReactNode;
  confirmLabel: string;
  color?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * One thing to make sure of before it is done.
 *
 * Each question is a modal of its own: a modal that has been closed is still on
 * screen while it fades away, so one modal asking whichever question is current
 * turns into the other one on the way out.
 */
export function ConfirmModal({
  opened,
  message,
  confirmLabel,
  color = "red",
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations();

  return (
    <Modal
      title={t("common.confirmAction")}
      opened={opened}
      size="md"
      centered
      onClose={onCancel}
    >
      <Text>{message}</Text>
      <Group justify="flex-end" mt="md">
        <Button color="gray" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button color={color} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
