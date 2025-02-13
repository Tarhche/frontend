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
import {deleteArticle} from "../../actions/delete-article";

type Props = {
  articleID: string;
  articleTitle?: string;
};

export function ArticleDeleteButton({articleID, articleTitle}: Props) {
  const [, formAction, isPending] = useActionState(deleteArticle, false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label="حذف کردن مقاله" withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label="حذف کردن مقاله"
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
        <Text>از حذف {`"${articleTitle}"`} مطمئن هستید؟</Text>
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
            <input type="hidden" name="id" value={articleID} />
            <Button color="red" type="submit" loading={isPending}>
              حذف کردن
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
