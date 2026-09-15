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
import {getUserPermissions, hasPermission} from "@/lib/auth";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchTasks, fetchMyTasks} from "@/dal/private/runner";
import {TaskRows, type Task} from "./task-rows";
import {TasksPagination} from "./tasks-table-pagination";

type Props = {
  page: number | string;

  /** whose tasks to show: everybody's, or the person asking. */
  scope?: "all" | "mine";
};

export async function TasksTable({page, scope = "all"}: Props) {
  // in somebody's own listing every row is theirs, so saying so on each one
  // says nothing.
  const showOwner = scope !== "mine";

  const {t} = await getServerDictionary();
  const response = await (scope === "mine" ? fetchMyTasks : fetchTasks)({
    params: {page},
  });

  const tasks: Task[] = response.items ?? [];
  const {total_pages, current_page} = response.pagination;

  // the row actions are rendered by a client component, so what the person may
  // do is worked out here and handed to it. Every task in one's own listing is
  // one's own, so the permission over one's own decides there, and the one over
  // everybody's decides in everybody's listing.
  const permissions = (await getUserPermissions()) ?? [];
  const own = scope === "mine";

  const may = {
    own,
    manage: hasPermission(permissions, [
      own ? "self.runner.tasks.manage" : "runner.tasks.manage",
    ]),
    delete: hasPermission(permissions, [
      own ? "self.runner.tasks.delete" : "runner.tasks.delete",
    ]),
  };

  return (
    <>
      <PermissionGuard allowedPermissions={["runner.tasks.create"]}>
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconFilePlus />}
            href={APP_PATHS.dashboard.tasks.new}
          >
            {t("tasks.table.newTask")}
          </Button>
        </Group>
      </PermissionGuard>
      <TableScrollContainer minWidth={700}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("tasks.table.name")}</TableTh>
              <TableTh>{t("tasks.table.image")}</TableTh>
              <TableTh>{t("tasks.table.state")}</TableTh>
              <TableTh>{t("tasks.table.endpoints")}</TableTh>
              {showOwner && <TableTh>{t("tasks.table.owner")}</TableTh>}
              <TableTh>{t("tasks.table.createdAt")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <TaskRows tasks={tasks} may={may} showOwner={showOwner} />
        </Table>
      </TableScrollContainer>
      {tasks.length >= 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <TasksPagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
