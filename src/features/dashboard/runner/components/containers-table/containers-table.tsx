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
import {fetchContainers} from "@/dal/private/runner";
import {StateBadge} from "../state-badge";
import {ContainerActions} from "./container-actions";
import {ContainerEndpoints, type Endpoint} from "./container-endpoints";
import {ContainersPagination} from "./containers-table-pagination";

type Props = {
  page: number | string;
};

type Container = {
  uuid: string;
  name: string;
  slug: string;
  state: string;
  image: string;
  endpoints: Endpoint[];
  created_at: string;
};

export async function ContainersTable({page}: Props) {
  const {t, locale} = await getServerDictionary();
  const response = await fetchContainers({params: {page}});

  const containers: Container[] = response.items ?? [];
  const {total_pages, current_page} = response.pagination;

  // the row actions are rendered by a client component, so what the person may
  // do is worked out here and handed to it.
  const permissions = (await getUserPermissions()) ?? [];
  const canManage = hasPermission(permissions, ["runner.containers.manage"]);
  const canDelete = hasPermission(permissions, ["runner.containers.delete"]);

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
              <TableTh>{t("containers.table.createdAt")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {containers.length === 0 && (
              <TableTr>
                <TableTd colSpan={6} ta="center">
                  {t("containers.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {containers.map((container) => (
              <TableTr key={container.uuid}>
                <TableTd>
                  <Link
                    href={APP_PATHS.dashboard.containers.detail(container.uuid)}
                  >
                    {container.name}
                  </Link>
                </TableTd>
                <TableTd>{container.image}</TableTd>
                <TableTd>
                  <StateBadge state={container.state} />
                </TableTd>
                <TableTd>
                  <ContainerEndpoints
                    endpoints={container.endpoints ?? []}
                    empty={t("containers.table.noEndpoints")}
                  />
                </TableTd>
                <TableTd>{formatDate(container.created_at, locale)}</TableTd>
                <TableTd>
                  <ContainerActions
                    uuid={container.uuid}
                    name={container.name}
                    state={container.state}
                    canManage={canManage}
                    canDelete={canDelete}
                  />
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
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
