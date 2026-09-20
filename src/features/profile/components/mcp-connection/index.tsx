"use client";

import {
  ActionIcon,
  Code,
  CopyButton,
  Group,
  List,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {IconCheck, IconCopy} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

type Props = {
  // endpoint is where an MCP client connects, which is this site's API rather
  // than this page's.
  endpoint: string;
};

// What somebody needs to point an agent at this site: the address, and what
// happens when they do.
export function McpConnection({endpoint}: Props) {
  const t = useTranslations();

  return (
    <Stack gap="sm">
      <Title order={4}>{t("profile.mcp.title")}</Title>
      <Text size="sm" c="dimmed">
        {t("profile.mcp.description")}
      </Text>

      <Group gap="xs" wrap="nowrap">
        <Code style={{overflowWrap: "anywhere"}}>{endpoint}</Code>
        <CopyButton value={endpoint} timeout={1500}>
          {({copied, copy}) => (
            <Tooltip
              label={copied ? t("common.copied") : t("common.copy")}
              withArrow
            >
              <ActionIcon
                variant="subtle"
                color={copied ? "teal" : "gray"}
                onClick={copy}
                aria-label={t("common.copy")}
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>

      <List size="sm" spacing="xs">
        <List.Item>{t("profile.mcp.signIn")}</List.Item>
        <List.Item>{t("profile.mcp.permissions")}</List.Item>
      </List>
    </Stack>
  );
}
