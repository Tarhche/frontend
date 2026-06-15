"use client";

import {useState, useActionState} from "react";
import {
  Tooltip,
  Modal,
  ActionIcon,
  Button,
  Group,
  rem,
  Text,
} from "@mantine/core";
import {IconTrash} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {deleteElement} from "../../actions/delete-element";

type Props = {
  elementID: string;
  elementTitle?: string;
};

export function ElementDeleteButton({elementID, elementTitle}: Props) {
  const t = useTranslations();
  const [, formAction, isPending] = useActionState(deleteElement, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label={t("elements.table.deleteElement")} withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label={t("elements.table.deleteElement")}
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
          {t("elements.table.deleteConfirm", {title: elementTitle ?? ""})}
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
            <input type="hidden" name="id" value={elementID} />
            <Button color="red" type="submit" loading={isPending}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
