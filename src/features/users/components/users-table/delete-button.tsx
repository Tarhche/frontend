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
import {deleteUserAction} from "../../actions/delete-user";

type Props = {
  userID: string;
  username?: string;
};

export function DeleteButton({userID, username}: Props) {
  const [, formAction, isPending] = useActionState(deleteUserAction, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label="حذف کردن کاربر" withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label="حذف کردن کاربر"
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
        <Text>از حذف {`"${username}"`} مطمئن هستید؟</Text>
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
            <input type="text" name="id" value={userID} readOnly hidden />
            <Button type="submit" color="red" loading={isPending}>
              حذف کردن
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
