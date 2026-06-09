"use client";

import {useState} from "react";
import {Box, Button, Group, Modal, Select, Text, Loader} from "@mantine/core";
import {IconLink, IconUnlink} from "@tabler/icons-react";
import {getArticleCorrelationUuid} from "../../actions/get-article-correlation";

type ConnectableArticle = {
  uuid: string;
  title: string;
};

type Props = {
  articles: ConnectableArticle[];
  defaultCorrelationUuid?: string;
  // The current article's own uuid (edit mode); used to tell "connected to
  // another article" apart from "is its own translation group".
  ownUuid?: string;
};

// Lets the editor connect the current article to another one as a translation:
// the current article then carries the selected article's correlation uuid (sent
// via the hidden `correlation_uuid` field on save/update).
export function ConnectArticleField({
  articles,
  defaultCorrelationUuid,
  ownUuid,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correlationUuid, setCorrelationUuid] = useState(
    defaultCorrelationUuid ?? "",
  );
  const [connectedTitle, setConnectedTitle] = useState("");

  const isConnected = Boolean(correlationUuid) && correlationUuid !== ownUuid;

  const handleSelect = async (uuid: string | null) => {
    if (!uuid) {
      return;
    }
    setLoading(true);
    const result = await getArticleCorrelationUuid(uuid);
    setLoading(false);
    if (result) {
      setCorrelationUuid(result.correlationUuid);
      setConnectedTitle(result.title);
      setOpened(false);
    }
  };

  const disconnect = () => {
    setCorrelationUuid("");
    setConnectedTitle("");
  };

  return (
    <Box>
      <input
        type="hidden"
        name="correlation_uuid"
        value={correlationUuid}
        readOnly
      />
      {isConnected ? (
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" c="dimmed">
            این مقاله به‌عنوان ترجمه‌ی
            {connectedTitle ? ` «${connectedTitle}» ` : " مقاله‌ای دیگر "}
            متصل شده است
          </Text>
          <Button
            variant="subtle"
            color="red"
            size="compact-sm"
            leftSection={<IconUnlink size={16} />}
            onClick={disconnect}
          >
            حذف اتصال
          </Button>
        </Group>
      ) : (
        <Button
          variant="light"
          leftSection={<IconLink size={16} />}
          onClick={() => setOpened(true)}
        >
          اتصال به مقاله دیگر (ترجمه)
        </Button>
      )}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="اتصال به مقاله دیگر"
        centered
      >
        <Text size="sm" c="dimmed" mb="sm">
          مقاله‌ای که این مقاله ترجمه‌ی آن است را انتخاب کنید.
        </Text>
        <Select
          searchable
          clearable
          placeholder="جستجو و انتخاب مقاله"
          nothingFoundMessage="مقاله‌ای یافت نشد"
          data={articles.map((article) => ({
            value: article.uuid,
            label: article.title,
          }))}
          onChange={handleSelect}
          disabled={loading}
          rightSection={loading ? <Loader size="xs" /> : undefined}
          maxDropdownHeight={280}
        />
      </Modal>
    </Box>
  );
}
