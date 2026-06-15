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
import {CommentDeleteButton} from "./comment-delete-button";
import {IconEye, IconPencil} from "@tabler/icons-react";
import {fetchAllComments} from "@/dal/private/comments";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {AuthorInline} from "@/features/authors/components";
import {getServerDictionary} from "@/i18n/server";

export const TABLE_HEADERS = [
  "#",
  "comments.table.headerComment",
  "comments.table.headerPublishDate",
  "comments.table.headerCreatedDate",
  "comments.table.headerAuthor",
  "common.actions",
];

type Props = {
  page: number | string;
};

export async function CommentsTable({page}: Props) {
  const {t} = await getServerDictionary();
  const commentsResponse = await fetchAllComments({
    params: {
      page: page,
    },
  });
  const comments = commentsResponse.items;
  const {total_pages, current_page} = commentsResponse.pagination;

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
            {comments.length === 0 && (
              <TableTr>
                <TableTd colSpan={TABLE_HEADERS.length} ta={"center"}>
                  {t("comments.table.emptyAll")}
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
                      formatDate(comment.approved_at)
                    ) : (
                      <Badge color="yellow" variant="light">
                        {t("comments.status.notApproved")}
                      </Badge>
                    )}
                  </TableTd>
                  <TableTd>{formatDate(comment.created_at)}</TableTd>
                  <TableTd>
                    <AuthorInline author={comment.author} />
                  </TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <Tooltip label={t("comments.table.view")} withArrow>
                        <ActionIcon
                          component={Link}
                          variant="light"
                          size="lg"
                          color="blue"
                          href={`/${comment.language_code}${APP_PATHS.articles.detail(comment.object_uuid)}`}
                          aria-label={t("comments.table.view")}
                        >
                          <IconEye style={{width: rem(20)}} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <PermissionGuard allowedPermissions={["comments.update"]}>
                        <Tooltip label={t("comments.table.edit")} withArrow>
                          <ActionIcon
                            component={Link}
                            variant="light"
                            size="lg"
                            color="blue"
                            href={APP_PATHS.dashboard.comments.edit(
                              comment.uuid,
                            )}
                            aria-label={t("comments.table.edit")}
                          >
                            <IconPencil style={{width: rem(20)}} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard allowedPermissions={["comments.delete"]}>
                        <CommentDeleteButton
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
        <Group mt="md" mb={"lg"} justify="flex-end">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
