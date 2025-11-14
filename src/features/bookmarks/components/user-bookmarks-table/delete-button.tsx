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

type Props = {
  bookmarkID: string;
  title?: string;
};

export function MyBookmarkDeleteButton({title, bookmarkID}: Props) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [, formAction, isPending] = useActionState(removeBookmarkAction, false);

  return (
    <>
      <Tooltip label="حذف کردن بوکمارک" withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label="حذف کردن بوکمارک"
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
        <Text>از حذف {`"${title}"`} مطمئن هستید؟</Text>
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
            <input type="text" name="id" value={bookmarkID} readOnly hidden />
            <Button color="red" type="submit" loading={isPending}>
              حذف کردن
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
