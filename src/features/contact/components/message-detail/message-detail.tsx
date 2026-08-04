import {
  Anchor,
  Badge,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {PermissionGuard} from "@/components/permission-guard";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {getServerDictionary} from "@/i18n/server";
import {ReadToggle} from "../messages-table/read-toggle";

type Props = {
  message: {
    uuid: string;
    subject: string;
    body: string;
    email?: string;
    phone?: string;
    read_at: string;
    created_at: string;
  };
};

export async function ContactMessageDetail({message}: Props) {
  const {t} = await getServerDictionary();
  const isRead = !isGregorianStartDateTime(message.read_at);

  return (
    <Paper withBorder p="xl">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Title order={3}>{message.subject}</Title>
        <Group gap="xs" wrap="nowrap">
          <PermissionGuard allowedPermissions={["contactus.markAsRead"]}>
            <ReadToggle uuid={message.uuid} isRead={isRead} />
          </PermissionGuard>
          <Badge color={isRead ? "green" : "yellow"} variant="light">
            {isRead ? t("contactUs.status.read") : t("contactUs.status.unread")}
          </Badge>
        </Group>
      </Group>

      <Text mt="md" style={{whiteSpace: "pre-wrap"}}>
        {message.body}
      </Text>

      <Divider my="lg" />

      <Stack gap="xs">
        {Boolean(message.email) && (
          <Group gap="xs">
            <Text c="dimmed" size="sm">
              {t("contactUs.detail.email")}
            </Text>
            <Anchor href={`mailto:${message.email}`} size="sm" dir="ltr">
              {message.email}
            </Anchor>
          </Group>
        )}
        {Boolean(message.phone) && (
          <Group gap="xs">
            <Text c="dimmed" size="sm">
              {t("contactUs.detail.phone")}
            </Text>
            <Anchor href={`tel:${message.phone}`} size="sm" dir="ltr">
              {message.phone}
            </Anchor>
          </Group>
        )}
        <Group gap="xs">
          <Text c="dimmed" size="sm">
            {t("contactUs.detail.receivedAt")}
          </Text>
          <Text size="sm">{formatDate(message.created_at)}</Text>
        </Group>
        <Group gap="xs">
          <Text c="dimmed" size="sm">
            {t("contactUs.detail.readAt")}
          </Text>
          <Text size="sm">
            {isRead
              ? formatDate(message.read_at)
              : t("contactUs.status.unread")}
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}
