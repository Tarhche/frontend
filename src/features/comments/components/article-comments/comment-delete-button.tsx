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

type Props = {
  commentID: string;
  commentMessage?: string;
};

export function CommentDeleteButton({commentID, commentMessage}: Props) {
  const [, formAction, isPending] = useActionState(deleteCommentAction, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label="حذف کردن کامنت" withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label="حذف کردن کامنت"
          onClick={() => {
            setIsConfirmOpen(true);
          }}
        >
          <IconTrash style={{width: rem(20)}} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
      <Modal
        title="تایید عملیات"
        opened={isConfirmOpen}
        size="md"
        centered
        onClose={() => {
          setIsConfirmOpen(false);
        }}
      >
        <Text>از حذف {`"${commentMessage}"`} مطمئن هستید؟</Text>
        <Group justify="flex-end" mt={"md"}>
          <Button
            color="gray"
            onClick={() => {
              setIsConfirmOpen(false);
            }}
          >
            لفو کردن
          </Button>
          <form action={formAction}>
            <input type="text" name="id" value={commentID} hidden readOnly />
            <Button color="red" loading={isPending}>
              حذف کردن
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
