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
  Button,
  rem,
} from "@mantine/core";
import {Pagination} from "@/components/pagination";
import {PermissionGuard} from "@/components/permission-guard";
import {RoleDeleteButton} from "./role-delete-button";
import {IconPencil, IconPlus} from "@tabler/icons-react";
import {fetchRoles} from "@/dal/private/roles";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export const TABLE_HEADERS = [
  "#",
  "roles.table.title",
  "roles.table.description",
  "common.actions",
];

type Props = {
  page: number | string;
};

export async function RolesTable({page}: Props) {
  const {t} = await getServerDictionary();
  await new Promise((res) => setTimeout(res, 3000));
  const {items: roles, pagination} = await fetchRoles({
    params: {
      page,
    },
  });

  return (
    <>
      <Group justify="flex-end">
        <Button
          variant="light"
          component={Link}
          href={APP_PATHS.dashboard.roles.new}
          leftSection={<IconPlus />}
        >
          {t("roles.table.newRole")}
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
            {roles.length === 0 && (
              <TableTr>
                <TableTd colSpan={TABLE_HEADERS.length} ta={"center"}>
                  {t("roles.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {roles.map((role: any, index: number) => {
              return (
                <TableTr key={role.uuid}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>{role.name}</TableTd>
                  <TableTd>{role.description}</TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <PermissionGuard
                        allowedPermissions={["roles.update", "roles.show"]}
                        operator="AND"
                      >
                        <Tooltip label={t("roles.table.editRole")} withArrow>
                          <ActionIcon
                            variant="light"
                            size="lg"
                            color="blue"
                            aria-label={t("roles.table.editRole")}
                            component={Link}
                            href={`${APP_PATHS.dashboard.roles.edit(role.uuid)}`}
                          >
                            <IconPencil style={{width: rem(20)}} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard allowedPermissions={["roles.delete"]}>
                        <RoleDeleteButton
                          roleId={role.uuid}
                          roleName={role.name}
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
      {roles.length >= 1 && (
        <Group mt="md" mb={"lg"} justify="flex-end">
          <Pagination
            total={pagination.total_pages}
            current={pagination.current_page}
          />
        </Group>
      )}
    </>
  );
}
