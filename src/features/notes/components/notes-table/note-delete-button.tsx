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
import {type NotesScope} from "@/dal/private/notes";
import {deleteNote} from "../../actions/delete-note";
import {useTranslations} from "@/i18n/provider";

type Props = {
  correlationUuid: string;
  languageCode: string;
  scope: NotesScope;
};

export function NoteDeleteButton({
  correlationUuid,
  languageCode,
  scope,
}: Props) {
  const t = useTranslations();
  const [, formAction, isPending] = useActionState(deleteNote, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label={t("notes.table.deleteNote")} withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label={t("notes.table.deleteNote")}
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
        <Text>{t("notes.table.deleteConfirm")}</Text>
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
            <input
              type="hidden"
              name="correlation_uuid"
              value={correlationUuid}
            />
            <input type="hidden" name="language_code" value={languageCode} />
            <input type="hidden" name="scope" value={scope} />
            <Button color="red" type="submit" loading={isPending}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
