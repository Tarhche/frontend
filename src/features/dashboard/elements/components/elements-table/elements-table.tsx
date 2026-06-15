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
import {PermissionGuard} from "@/components/permission-guard";
import {ArticlesPagination} from "./elements-table-pagination";
import {ElementDeleteButton} from "./element-delete-button";
import {IconPencil, IconFilePlus, type TablerIcon} from "@tabler/icons-react";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {type Permissions} from "@/lib/app-permissions";
import {getServerDictionary} from "@/i18n/server";
import {fetchAllElements} from "@/dal/private/elements";

type Props = {
  page: number | string;
};

type TableAction = {
  tooltipLabel: string;
  Icon: TablerIcon;
  color: string;
  allowedPermissions: Permissions[];
  href: (uuid: string) => string;
  disabled: (...args: any[]) => boolean;
};

export async function ElementsTable({page}: Props) {
  const {t} = await getServerDictionary();
  const elementsResponse = await fetchAllElements({
    params: {
      page: page,
    },
  });

  const elements = elementsResponse.items;
  const {total_pages, current_page} = elementsResponse.pagination;

  const tableActions: TableAction[] = [
    {
      tooltipLabel: t("elements.table.editElement"),
      Icon: IconPencil,
      color: "blue",
      allowedPermissions: ["elements.update"],
      href: (uuid: string) => APP_PATHS.dashboard.elements.edit(uuid),
      disabled: () => false,
    },
  ];

  return (
    <>
      <PermissionGuard allowedPermissions={["elements.create"]}>
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconFilePlus />}
            href={APP_PATHS.dashboard.elements.new}
          >
            {t("elements.table.newElement")}
          </Button>
        </Group>
      </PermissionGuard>
      <TableScrollContainer minWidth={500}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>#</TableTh>
              <TableTh>{t("elements.table.titleColumn")}</TableTh>
              <TableTh>{t("elements.table.type")}</TableTh>
              <TableTh>{t("elements.table.createdAt")}</TableTh>
              <TableTh>{t("common.actions")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {elements.length === 0 && (
              <TableTr>
                <TableTd colSpan={4} ta={"center"}>
                  {t("elements.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {elements.map((element: any, index: number) => {
              const isPublished = !isGregorianStartDateTime(
                element.published_at,
              );

              return (
                <TableTr key={element.uuid}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>{element.uuid}</TableTd>
                  <TableTd>{element.body_type}</TableTd>
                  <TableTd>{formatDate(element.created_at)}</TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      {tableActions.map(
                        ({
                          Icon,
                          tooltipLabel,
                          color,
                          href,
                          allowedPermissions,
                          disabled,
                        }) => {
                          return (
                            <PermissionGuard
                              key={tooltipLabel}
                              allowedPermissions={allowedPermissions}
                            >
                              <Tooltip label={tooltipLabel} withArrow>
                                <ActionIcon
                                  component={Link}
                                  variant="light"
                                  size="lg"
                                  color={color}
                                  href={href(element.uuid)}
                                  disabled={disabled(isPublished === false)}
                                  aria-label={tooltipLabel}
                                >
                                  <Icon style={{width: rem(20)}} stroke={1.5} />
                                </ActionIcon>
                              </Tooltip>
                            </PermissionGuard>
                          );
                        },
                      )}
                      <PermissionGuard allowedPermissions={["elements.delete"]}>
                        <ElementDeleteButton
                          elementID={element.uuid}
                          elementTitle={element.uuid}
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
      {elements.length >= 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <ArticlesPagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
