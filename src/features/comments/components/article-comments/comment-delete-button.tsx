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
import {deleteCommentAction} from "../../actions/delete-comment";
import {IconTrash} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

type Props = {
  commentID: string;
  commentMessage?: string;
};

export function CommentDeleteButton({commentID, commentMessage}: Props) {
  const t = useTranslations();
  const [, formAction, isPending] = useActionState(deleteCommentAction, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label={t("comments.table.delete")} withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label={t("comments.table.delete")}
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
          {t("comments.form.deleteConfirm", {message: commentMessage ?? ""})}
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
            <input type="text" name="id" value={commentID} hidden readOnly />
            <Button color="red" type="submit" loading={isPending}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
