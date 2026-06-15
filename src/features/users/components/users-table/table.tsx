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
  Stack,
  Button,
  rem,
} from "@mantine/core";
import {UserAvatar} from "@/components/user-avatar";
import {Pagination} from "@/components/pagination";
import {PermissionGuard} from "@/components/permission-guard";
import {DeleteButton} from "./delete-button";
import {IconPencil, IconUserPlus} from "@tabler/icons-react";
import {fetchUsers} from "@/dal/private/users";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export const TABLE_HEADERS = [
  "#",
  "users.table.avatar",
  "users.table.name",
  "users.table.username",
  "users.table.email",
  "common.actions",
];

type Props = {
  page: number | string;
};

export async function UsersTable({page}: Props) {
  const {t} = await getServerDictionary();
  const {items: users, pagination} = await fetchUsers({
    params: {
      page: page,
    },
  });
  const {total_pages, current_page} = pagination;

  return (
    <Stack>
      <Group justify="flex-end">
        <Button
          variant="light"
          component={Link}
          leftSection={<IconUserPlus />}
          href={APP_PATHS.dashboard.users.new}
        >
          {t("users.table.newUser")}
        </Button>
      </Group>
      <TableScrollContainer minWidth={500}>
        <Table verticalSpacing={"sm"} striped withRowBorders>
          <TableThead>
            <TableTr>
              {TABLE_HEADERS.map((h) => {
                return <TableTh key={h}>{h === "#" ? h : t(h)}</TableTh>;
              })}
            </TableTr>
          </TableThead>
          <TableTbody>
            {users.length === 0 && (
              <TableTr>
                <TableTd colSpan={TABLE_HEADERS.length} ta={"center"}>
                  {t("users.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {users.map((user: any, index: number) => {
              return (
                <TableTr key={user.uuid}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>
                    <UserAvatar
                      width={48}
                      height={48}
                      userId={user.uuid}
                      src={user.avatar}
                    />
                  </TableTd>
                  <TableTd>{user.name}</TableTd>
                  <TableTd>{user.username}</TableTd>
                  <TableTd>{user.email}</TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <PermissionGuard
                        allowedPermissions={["users.update", "users.show"]}
                        operator="AND"
                      >
                        <Tooltip label={t("users.table.editUser")} withArrow>
                          <ActionIcon
                            variant="light"
                            size="lg"
                            color="blue"
                            aria-label={t("users.table.editUser")}
                            component={Link}
                            href={`${APP_PATHS.dashboard.users.edit(user.uuid)}`}
                          >
                            <IconPencil style={{width: rem(20)}} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard allowedPermissions={["users.delete"]}>
                        <DeleteButton userID={user.uuid} username={user.name} />
                      </PermissionGuard>
                    </ActionIconGroup>
                  </TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableScrollContainer>
      {users.length >= 1 && (
        <Group mt="md" mb={"lg"} justify="flex-end">
          <Pagination total={total_pages} current={current_page} />
        </Group>
      )}
    </Stack>
  );
}
