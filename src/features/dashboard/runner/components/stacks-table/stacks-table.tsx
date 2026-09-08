import Link from "@/components/link";
import {
  Button,
  Group,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
} from "@mantine/core";
import {IconFilePlus} from "@tabler/icons-react";
import {PermissionGuard} from "@/components/permission-guard";
import {getServerDictionary} from "@/i18n/server";
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {APP_PATHS} from "@/lib/app-paths";
import {formatDate} from "@/lib/date-and-time";
import {fetchStacks} from "@/dal/private/runner";
import {StateBadge} from "../state-badge";
import {StackActions} from "./stack-actions";
import {StacksPagination} from "./stacks-table-pagination";

type Props = {
  page: number | string;
};

type Stack = {
  uuid: string;
  name: string;
  slug: string;
  state: string;
  services: unknown[];
  created_at: string;
};

export async function StacksTable({page}: Props) {
  const {t, locale} = await getServerDictionary();
  const response = await fetchStacks({params: {page}});

  const stacks: Stack[] = response.items ?? [];
  const {total_pages, current_page} = response.pagination;

  const permissions = (await getUserPermissions()) ?? [];
  const canManage = hasPermission(permissions, ["runner.stacks.manage"]);
  const canDelete = hasPermission(permissions, ["runner.stacks.delete"]);

  return (
    <>
      <PermissionGuard allowedPermissions={["runner.stacks.create"]}>
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconFilePlus />}
            href={APP_PATHS.dashboard.stacks.new}
          >
            {t("stacks.table.newStack")}
          </Button>
        </Group>
      </PermissionGuard>
      <TableScrollContainer minWidth={600}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("stacks.table.name")}</TableTh>
              <TableTh>{t("stacks.table.state")}</TableTh>
              <TableTh>{t("stacks.table.services")}</TableTh>
              <TableTh>{t("stacks.table.createdAt")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {stacks.length === 0 && (
              <TableTr>
                <TableTd colSpan={5} ta="center">
                  {t("stacks.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {stacks.map((stack) => (
              <TableTr key={stack.uuid}>
                <TableTd>
                  <Link href={APP_PATHS.dashboard.stacks.detail(stack.uuid)}>
                    {stack.name}
                  </Link>
                </TableTd>
                <TableTd>
                  <StateBadge state={stack.state} />
                </TableTd>
                <TableTd>{stack.services?.length ?? 0}</TableTd>
                <TableTd>{formatDate(stack.created_at, locale)}</TableTd>
                <TableTd>
                  <StackActions
                    uuid={stack.uuid}
                    name={stack.name}
                    state={stack.state}
                    canManage={canManage}
                    canDelete={canDelete}
                  />
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableScrollContainer>
      {stacks.length >= 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <StacksPagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
