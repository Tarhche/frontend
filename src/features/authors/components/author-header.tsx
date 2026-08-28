"use client";

import {Group, Paper, Stack, Text, Title} from "@mantine/core";
import {IconCalendar} from "@tabler/icons-react";
import {UserAvatar} from "@/components/user-avatar";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {useI18n, useTranslations} from "@/i18n/provider";
import {EditContentButton} from "@/components/edit-content-button";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {type AuthorWithCreatedAt} from "../types";

type Props = {
  author: AuthorWithCreatedAt;
};

export function AuthorHeader({author}: Props) {
  const t = useTranslations();
  const {locale} = useI18n();
  const hasJoinDate =
    Boolean(author.created_at) && !isGregorianStartDateTime(author.created_at);

  return (
    <Paper p={"lg"} radius={"md"} withBorder pos="relative">
      {author.uuid && (
        <EditContentButton
          href={APP_PATHS.dashboard.users.edit(author.uuid)}
          permission={PERMISSIONS.users.UPDATE}
          floating
        />
      )}
      <Group align="center" wrap="nowrap" gap={"lg"}>
        <UserAvatar
          src={author.avatar || undefined}
          userId={author.uuid}
          width={96}
          height={96}
        />
        <Stack gap={4}>
          <Title order={2}>
            {author.name || author.username || t("authors.fallbackName")}
          </Title>
          {author.username && (
            <Text size="sm" c="dimmed">
              @{author.username}
            </Text>
          )}
          {hasJoinDate && (
            <Group gap={6} mt={4} c={"dimmed"} wrap="nowrap">
              <IconCalendar size={16} />
              <Text size="xs">
                {t("authors.memberSince", {
                  date: formatDate(author.created_at, locale),
                })}
              </Text>
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
