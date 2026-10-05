import {
  Group,
  Table,
  TableScrollContainer,
  TableTh,
  TableThead,
  TableTr,
} from "@mantine/core";
import {Pagination} from "@/components/pagination";
import {getServerDictionary} from "@/i18n/server";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {type Scope} from "@/features/dashboard/workload/vms/api";
import {fetchSnapshots} from "../../dal";
import {SnapshotRows} from "./snapshot-rows";

type Props = {
  page: number | string;

  /** Whose snapshots: everybody's, or the person asking. */
  scope?: Scope;
};

export async function SnapshotsTable({page, scope = "all"}: Props) {
  const {t} = await getServerDictionary();
  const response = await fetchSnapshots(scope, {page});
  const items = response.items ?? [];

  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();
  const showOwner = scope === "all";

  return (
    <>
      <TableScrollContainer minWidth={900}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("snapshots.table.name")}</TableTh>
              <TableTh>{t("snapshots.table.vm")}</TableTh>
              <TableTh>{t("snapshots.table.kind")}</TableTh>
              <TableTh>{t("snapshots.table.size")}</TableTh>
              <TableTh>{t("snapshots.table.state")}</TableTh>
              <TableTh>{t("snapshots.table.createdAt")}</TableTh>
              {showOwner && <TableTh>{t("snapshots.table.owner")}</TableTh>}
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <SnapshotRows
            scope={scope}
            page={page}
            initial={{...response, items}}
            permissions={permissions}
            me={me}
            showOwner={showOwner}
          />
        </Table>
      </TableScrollContainer>
      {items.length > 0 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <Pagination
            total={response.pagination.total_pages}
            current={response.pagination.current_page}
          />
        </Group>
      )}
    </>
  );
}
