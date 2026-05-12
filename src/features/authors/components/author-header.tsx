import {Group, Paper, Stack, Text, Title} from "@mantine/core";
import {IconCalendar} from "@tabler/icons-react";
import {UserAvatar} from "@/components/user-avatar";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {type AuthorWithCreatedAt} from "../types";

type Props = {
  author: AuthorWithCreatedAt;
};

export function AuthorHeader({author}: Props) {
  const hasJoinDate =
    Boolean(author.created_at) && !isGregorianStartDateTime(author.created_at);

  return (
    <Paper p={"lg"} radius={"md"} withBorder>
      <Group align="center" wrap="nowrap" gap={"lg"}>
        <UserAvatar
          src={author.avatar || undefined}
          userId={author.uuid}
          width={96}
          height={96}
        />
        <Stack gap={4}>
          <Title order={2}>{author.name || author.username || "نویسنده"}</Title>
          {author.username && (
            <Text size="sm" c="dimmed">
              @{author.username}
            </Text>
          )}
          {hasJoinDate && (
            <Group gap={6} mt={4} c={"dimmed"} wrap="nowrap">
              <IconCalendar size={16} />
              <Text size="xs">عضو از {formatDate(author.created_at)}</Text>
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
