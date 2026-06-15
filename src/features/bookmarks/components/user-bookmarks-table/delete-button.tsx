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
import {removeBookmarkAction} from "../../actions/remove-bookmark";
import {useTranslations} from "@/i18n/provider";

type Props = {
  bookmarkID: string;
  languageCode: string;
  title?: string;
};

export function MyBookmarkDeleteButton({
  title,
  bookmarkID,
  languageCode,
}: Props) {
  const t = useTranslations();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [, formAction, isPending] = useActionState(removeBookmarkAction, false);

  return (
    <>
      <Tooltip label={t("bookmarks.delete.tooltip")} withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label={t("bookmarks.delete.ariaLabel")}
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
        <Text>{t("bookmarks.delete.confirm", {title: title ?? ""})}</Text>
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
            <input type="text" name="id" value={bookmarkID} readOnly hidden />
            <input
              type="text"
              name="language-code"
              value={languageCode}
              readOnly
              hidden
            />
            <Button color="red" type="submit" loading={isPending}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
