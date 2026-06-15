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
  rem,
} from "@mantine/core";
import {PermissionGuard} from "@/components/permission-guard";
import {Pagination} from "@/components/pagination";
import {MyBookmarkDeleteButton} from "./delete-button";
import {IconEye} from "@tabler/icons-react";
import {fetchUserBookmarks} from "@/dal/private/bookmarks";
import {formatDate} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export const TABLE_HEADERS = ["index", "title", "date", "actions"];

type Props = {
  page: number | string;
};

export async function UserBookmarksTable({page}: Props) {
  const {t} = await getServerDictionary();
  const headers = [
    "#",
    t("bookmarks.table.headerTitle"),
    t("bookmarks.table.headerDate"),
    t("common.actions"),
  ];
  const bookmarksResponse = await fetchUserBookmarks({
    params: {
      page: page,
    },
  });
  const bookmarks = bookmarksResponse.items;
  const {total_pages, current_page} = bookmarksResponse.pagination;

  return (
    <>
      <TableScrollContainer minWidth={500}>
        <Table verticalSpacing={"sm"} striped withRowBorders>
          <TableThead>
            <TableTr>
              {headers.map((h) => {
                return <TableTh key={h}>{h}</TableTh>;
              })}
            </TableTr>
          </TableThead>
          <TableTbody>
            {bookmarks.length === 0 && (
              <TableTr>
                <TableTd colSpan={headers.length} ta={"center"}>
                  {t("bookmarks.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {bookmarks.map((bookmark: any, index: number) => {
              return (
                <TableTr key={bookmark.object_uuid}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>{bookmark.title}</TableTd>
                  <TableTd>{formatDate(bookmark.created_at)}</TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <Tooltip label={t("bookmarks.table.view")} withArrow>
                        <ActionIcon
                          variant="light"
                          size="lg"
                          color="blue"
                          aria-label={t("bookmarks.table.view")}
                          component={Link}
                          href={`/${bookmark.language_code}${APP_PATHS.articles.detail(bookmark.object_uuid)}`}
                        >
                          <IconEye style={{width: rem(20)}} stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                      <PermissionGuard
                        allowedPermissions={["self.bookmarks.delete"]}
                      >
                        <MyBookmarkDeleteButton
                          title={bookmark.title}
                          bookmarkID={bookmark.object_uuid}
                          languageCode={bookmark.language_code}
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
      {bookmarks.length >= 1 && (
        <Group mt="md" mb={"lg"} justify="flex-end">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
