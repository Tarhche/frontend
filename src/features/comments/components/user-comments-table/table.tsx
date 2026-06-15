import Link from "@/components/link";
import {
  Table,
  TableTr,
  TableTd,
  TableTh,
  TableThead,
  TableTbody,
  TableScrollContainer,
  ActionIcon,
  ActionIconGroup,
  Tooltip,
  Group,
  Badge,
  rem,
} from "@mantine/core";
import {PermissionGuard} from "@/components/permission-guard";
import {Pagination} from "@/components/pagination";
import {DeleteButton} from "./delete-button";
import {IconEye} from "@tabler/icons-react";
import {fetchUserComments} from "@/dal/private/comments";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export const TABLE_HEADERS = [
  "#",
  "comments.table.headerComment",
  "common.status",
  "comments.table.headerCreatedDate",
  "common.actions",
];

type Props = {
  page: number | string;
};

export async function UserCommentsTable({page}: Props) {
  const {t} = await getServerDictionary();
  const commentsResponse = await fetchUserComments({
    params: {
      page: page,
    },
  });
  const comments = commentsResponse.items;
  const {total_pages, current_page} = commentsResponse.pagination;

  return (
    <>
      <TableScrollContainer minWidth={500}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              {TABLE_HEADERS.map((h) => {
                return <TableTh key={h}>{t(h)}</TableTh>;
              })}
            </TableTr>
          </TableThead>
          <TableTbody>
            {comments.length === 0 && (
              <TableTr>
                <TableTd colSpan={TABLE_HEADERS.length} ta="center">
                  {t("comments.table.emptyUser")}
                </TableTd>
              </TableTr>
            )}
            {comments.map((comment: any, index: number) => {
              const isApproved = !isGregorianStartDateTime(comment.approved_at);

              return (
                <TableTr key={comment.uuid}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>{comment.body}</TableTd>
                  <TableTd>
                    {isApproved ? (
                      <Badge color="green" variant="light">
                        {t("comments.status.approved")}
                      </Badge>
                    ) : (
                      <Badge color="yellow" variant="light">
                        {t("comments.status.pending")}
                      </Badge>
                    )}
                  </TableTd>
                  <TableTd>{formatDate(comment.created_at)}</TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <Tooltip label={t("comments.table.view")} withArrow>
                        <ActionIcon
                          variant="light"
                          size="lg"
                          color="blue"
                          aria-label={t("comments.table.view")}
                          component={Link}
                          href={`/${comment.language_code}${APP_PATHS.articles.detail(comment.object_uuid)}`}
                        >
                          <IconEye style={{width: rem(20)}} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <PermissionGuard
                        allowedPermissions={["self.comments.delete"]}
                      >
                        <DeleteButton
                          commentID={comment.uuid}
                          commentMessage={comment.body}
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
      {comments.length >= 1 && (
        <Group mt="md" mb="lg" justify="flex-end">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
