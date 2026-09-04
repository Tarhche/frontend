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
import {fetchContainers, fetchMyContainers} from "@/dal/private/runner";
import {ContainerRows, type Container} from "./container-rows";
import {ContainersPagination} from "./containers-table-pagination";

type Props = {
  page: number | string;

  /** whose containers to show: everybody's, or the person asking. */
  scope?: "all" | "mine";
};

export async function ContainersTable({page, scope = "all"}: Props) {
  // in somebody's own listing every row is theirs, so saying so on each one
  // says nothing.
  const showOwner = scope !== "mine";

  const {t} = await getServerDictionary();
  const response = await (
    scope === "mine" ? fetchMyContainers : fetchContainers
  )({params: {page}});

  const containers: Container[] = response.items ?? [];
  const {total_pages, current_page} = response.pagination;

  // the row actions are rendered by a client component, so what the person may
  // do is worked out here and handed to it.
  // acting on one of these turns on two permissions: over everybody's, or
  // over one's own — so who is looking decides row by row.
  const permissions = (await getUserPermissions()) ?? [];
  const viewerUuid = (await getUserUUID()) ?? "";

  const may = {
    manageAll: hasPermission(permissions, ["runner.containers.manage"]),
    manageOwn: hasPermission(permissions, ["self.runner.containers.manage"]),
    deleteAll: hasPermission(permissions, ["runner.containers.delete"]),
    deleteOwn: hasPermission(permissions, ["self.runner.containers.delete"]),
  };

  return (
    <>
      <PermissionGuard allowedPermissions={["runner.containers.create"]}>
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconFilePlus />}
            href={APP_PATHS.dashboard.containers.new}
          >
            {t("containers.table.newContainer")}
          </Button>
        </Group>
      </PermissionGuard>
      <TableScrollContainer minWidth={700}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("containers.table.name")}</TableTh>
              <TableTh>{t("containers.table.image")}</TableTh>
              <TableTh>{t("containers.table.state")}</TableTh>
              <TableTh>{t("containers.table.endpoints")}</TableTh>
              {showOwner && <TableTh>{t("containers.table.owner")}</TableTh>}
              <TableTh>{t("containers.table.createdAt")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <ContainerRows
            containers={containers}
            may={may}
            viewerUuid={viewerUuid}
            showOwner={showOwner}
          />
        </Table>
      </TableScrollContainer>
      {containers.length >= 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <ContainersPagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
