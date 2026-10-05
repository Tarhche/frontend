import {
  Button,
  Group,
  Table,
  TableScrollContainer,
  TableTh,
  TableThead,
  TableTr,
} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import Link from "@/components/link";
import {Pagination} from "@/components/pagination";
import {PermissionGuard} from "@/components/permission-guard";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {getUserPermissions, getUserUuid} from "@/lib/auth";
import {type Scope} from "../../api";
import {fetchVms} from "../../dal";
import {VmRows} from "./vm-rows";

type Props = {
  page: number | string;

  /** Whose VMs: everybody's, or the person asking. */
  scope?: Scope;
};

export async function VmsTable({page, scope = "all"}: Props) {
  const {t} = await getServerDictionary();
  const response = await fetchVms(scope, {page});
  const items = response.items ?? [];

  // the rows are a client component, so what the person may do to each is
  // worked out there from what they hold and who they are.
  const permissions = (await getUserPermissions()) ?? [];
  const me = await getUserUuid();

  // in somebody's own listing every row is theirs, so saying so on each one
  // says nothing.
  const showOwner = scope === "all";

  return (
    <>
      <PermissionGuard allowedPermissions={["workload.vms.create"]}>
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconPlus />}
            href={APP_PATHS.dashboard.vms.new}
          >
            {t("vms.table.newVm")}
          </Button>
        </Group>
      </PermissionGuard>
      <TableScrollContainer minWidth={960}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("vms.table.name")}</TableTh>
              <TableTh>{t("vms.table.kind")}</TableTh>
              <TableTh>{t("vms.table.state")}</TableTh>
              <TableTh>{t("vms.table.cpu")}</TableTh>
              <TableTh>{t("vms.table.memory")}</TableTh>
              <TableTh>{t("vms.table.disk")}</TableTh>
              <TableTh>{t("vms.table.expires")}</TableTh>
              {showOwner && <TableTh>{t("vms.table.owner")}</TableTh>}
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <VmRows
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
