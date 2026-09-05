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
import {
  deleteArticle,
  deleteMyArticleAction,
} from "../../actions/delete-article";
import {useTranslations} from "@/i18n/provider";

type Props = {
  correlationUuid: string;
  languageCode: string;
  articleTitle?: string;

  // whether this is asked for as one's own, which is a different thing to ask
  // for: an article somebody else wrote is not there to be deleted that way.
  own?: boolean;
};

export function ArticleDeleteButton({
  correlationUuid,
  languageCode,
  articleTitle,
  own = false,
}: Props) {
  const t = useTranslations();
  const [, formAction, isPending] = useActionState(
    own ? deleteMyArticleAction : deleteArticle,
    false,
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <Tooltip label={t("articles.table.deleteArticle")} withArrow>
        <ActionIcon
          variant="light"
          size="lg"
          color="red"
          aria-label={t("articles.table.deleteArticle")}
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
          {t("articles.table.deleteConfirm", {title: articleTitle ?? ""})}
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
            <input
              type="hidden"
              name="correlation_uuid"
              value={correlationUuid}
            />
            <input type="hidden" name="language_code" value={languageCode} />
            <Button color="red" type="submit" loading={isPending}>
              {t("common.delete")}
            </Button>
          </form>
        </Group>
      </Modal>
    </>
  );
}
