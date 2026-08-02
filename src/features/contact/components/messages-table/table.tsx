import Link from "@/components/link";
import {
  ActionIcon,
  ActionIconGroup,
  Badge,
  Group,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import {IconEye} from "@tabler/icons-react";
import {PermissionGuard} from "@/components/permission-guard";
import {Pagination} from "@/components/pagination";
import {fetchContactMessages} from "@/dal/private/contact";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";
import {MessageDeleteButton} from "./delete-button";
import {ReadToggle} from "./read-toggle";

export const TABLE_HEADERS = [
  "#",
  "contactUs.table.headerSubject",
  "contactUs.table.headerSender",
  "contactUs.table.headerReceivedDate",
  "contactUs.table.headerRead",
  "common.actions",
];

type Props = {
  page: number | string;
};

export async function ContactMessagesTable({page}: Props) {
  const {t} = await getServerDictionary();
  const messagesResponse = await fetchContactMessages({
    params: {
      page: page,
    },
  });
  const messages = messagesResponse.items;
  const {total_pages, current_page} = messagesResponse.pagination;

  return (
    <>
      <TableScrollContainer minWidth={500}>
        <Table verticalSpacing={"sm"} striped withRowBorders>
          <TableThead>
            <TableTr>
              {TABLE_HEADERS.map((h) => {
                return <TableTh key={h}>{t(h)}</TableTh>;
              })}
            </TableTr>
          </TableThead>
          <TableTbody>
            {messages.length === 0 && (
              <TableTr>
                <TableTd colSpan={TABLE_HEADERS.length} ta={"center"}>
                  {t("contactUs.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {messages.map((message: any, index: number) => {
              const isRead = !isGregorianStartDateTime(message.read_at);

              return (
                <TableTr key={message.uuid}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>{message.subject}</TableTd>
                  <TableTd>
                    {/* The sender is anonymous — whichever way they left to be
                        reached is all we have to identify them by. */}
                    <Stack gap={2}>
                      {Boolean(message.email) && (
                        <Text size="sm">{message.email}</Text>
                      )}
                      {Boolean(message.phone) && (
                        <Text size="sm" dir="ltr">
                          {message.phone}
                        </Text>
                      )}
                    </Stack>
                  </TableTd>
                  <TableTd>{formatDate(message.created_at)}</TableTd>
                  <TableTd>
                    <Group gap="xs" wrap="nowrap">
                      <PermissionGuard
                        allowedPermissions={["contactus.markAsRead"]}
                      >
                        <ReadToggle uuid={message.uuid} isRead={isRead} />
                      </PermissionGuard>
                      {isRead ? (
                        <Badge color="green" variant="light">
                          {formatDate(message.read_at)}
                        </Badge>
                      ) : (
                        <Badge color="yellow" variant="light">
                          {t("contactUs.status.unread")}
                        </Badge>
                      )}
                    </Group>
                  </TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <PermissionGuard allowedPermissions={["contactus.show"]}>
                        <Tooltip label={t("contactUs.table.view")} withArrow>
                          <ActionIcon
                            component={Link}
                            variant="light"
                            size="lg"
                            color="blue"
                            href={APP_PATHS.dashboard.contactUs.detail(
                              message.uuid,
                            )}
                            aria-label={t("contactUs.table.view")}
                          >
                            <IconEye style={{width: rem(20)}} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard
                        allowedPermissions={["contactus.delete"]}
                      >
                        <MessageDeleteButton
                          uuid={message.uuid}
                          subject={message.subject}
                        />
                      </PermissionGuard>
                    </ActionIconGroup>
                  </TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableScrollContainer>
      {messages.length >= 1 && (
        <Group mt="md" mb={"lg"} justify="flex-end">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
