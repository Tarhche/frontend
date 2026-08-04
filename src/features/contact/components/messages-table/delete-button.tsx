"use client";

import {useState, useActionState} from "react";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import {IconTrash} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {deleteContactMessageAction} from "../../actions/delete-message";

type Props = {
  uuid: string;
  subject?: string;
};

export function MessageDeleteButton({uuid, subject}: Props) {
  const t = useTranslations();
  const [, formAction, isPending] = useActionState(
    deleteContactMessageAction,
    false,
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label={t("contactUs.table.delete")} withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label={t("contactUs.table.delete")}
          onClick={() => {
            setIsConfirmOpen(true);
          }}
        >
          <IconTrash style={{width: rem(20)}} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
      <Modal
        title={t("common.confirmAction")}
        opened={isConfirmOpen}
        size="md"
        centered
        onClose={() => {
          setIsConfirmOpen(false);
        }}
      >
        <Text>
          {t("contactUs.table.deleteConfirm", {subject: subject ?? ""})}
        </Text>
        <Group justify="flex-end" mt={"md"}>
          <Button
            color="gray"
            onClick={() => {
              setIsConfirmOpen(false);
            }}
          >
            {t("common.cancel")}
          </Button>
          <form action={formAction}>
            <input type="text" name="id" value={uuid} hidden readOnly />
            <Button color="red" type="submit" loading={isPending}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
