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
import {deleteLanguageAction} from "../../actions/delete-language";

type Props = {
  code: string;
  languageName?: string;
};

export function LanguageDeleteButton({code, languageName}: Props) {
  const [, formAction, isPending] = useActionState(deleteLanguageAction, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label="حذف کردن زبان" withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label="حذف کردن زبان"
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
        <Text>از حذف {`"${languageName}"`} مطمئن هستید؟</Text>
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
            <input type="text" name="code" value={code} hidden readOnly />
            <Button color="red" type="submit" loading={isPending}>
              حذف کردن
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
