import Link from "@/components/link";
import {
  Button,
  Group,
  Table,
  TableScrollContainer,
  TableTh,
  TableThead,
  TableTr,
} from "@mantine/core";
import {IconFilePlus} from "@tabler/icons-react";
import {PermissionGuard} from "@/components/permission-guard";
import {getServerDictionary} from "@/i18n/server";
import {getUserPermissions, getUserUUID, hasPermission} from "@/lib/auth";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchStacks, fetchMyStacks} from "@/dal/private/runner";
import {StackRows, type Stack} from "./stack-rows";
import {StacksPagination} from "./stacks-table-pagination";

type Props = {
  page: number | string;

  /** whose stacks to show: everybody's, or the person asking. */
  scope?: "all" | "mine";
};

export async function StacksTable({page, scope = "all"}: Props) {
  const {t} = await getServerDictionary();
  const response = await (scope === "mine" ? fetchMyStacks : fetchStacks)({
    params: {page},
  });

  const stacks: Stack[] = response.items ?? [];
  const {total_pages, current_page} = response.pagination;

  // acting on one of these turns on two permissions: over everybody's, or
  // over one's own — so who is looking decides row by row.
  const permissions = (await getUserPermissions()) ?? [];
  const viewerUuid = (await getUserUUID()) ?? "";

  const may = {
    manageAll: hasPermission(permissions, ["runner.stacks.manage"]),
    manageOwn: hasPermission(permissions, ["self.runner.stacks.manage"]),
    deleteAll: hasPermission(permissions, ["runner.stacks.delete"]),
    deleteOwn: hasPermission(permissions, ["self.runner.stacks.delete"]),
  };

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
              <TableTh>{t("stacks.table.owner")}</TableTh>
              <TableTh>{t("stacks.table.createdAt")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <StackRows stacks={stacks} may={may} viewerUuid={viewerUuid} />
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
