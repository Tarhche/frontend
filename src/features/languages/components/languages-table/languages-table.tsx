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
import {LanguageDeleteButton} from "./language-delete-button";
import {IconPencil, IconPlus} from "@tabler/icons-react";
import {fetchLanguages} from "@/dal/private/languages";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";

export const TABLE_HEADERS = [
  "#",
  "languages.table.code",
  "languages.table.name",
  "common.actions",
];

type Props = {
  page: number | string;
};

export async function LanguagesTable({page}: Props) {
  const {t} = await getServerDictionary();
  const {items: languages, pagination} = await fetchLanguages({
    params: {
      page,
    },
  });

  return (
    <>
      <Group justify="flex-end">
        <PermissionGuard allowedPermissions={["languages.create"]}>
          <Button
            variant="light"
            component={Link}
            href={APP_PATHS.dashboard.languages.new}
            leftSection={<IconPlus />}
          >
            {t("languages.table.newLanguage")}
          </Button>
        </PermissionGuard>
      </Group>
      <TableScrollContainer minWidth={500}>
        <Table verticalSpacing={"sm"} striped withRowBorders>
          <TableThead>
            <TableTr>
              {TABLE_HEADERS.map((h) => {
                return <TableTh key={h}>{t(h)}</TableTh>;
              })}
            </TableTr>
          </TableThead>
          <TableTbody>
            {languages.length === 0 && (
              <TableTr>
                <TableTd colSpan={TABLE_HEADERS.length} ta={"center"}>
                  {t("languages.table.empty")}
                </TableTd>
              </TableTr>
            )}
            {languages.map((language: any, index: number) => {
              return (
                <TableTr key={language.code}>
                  <TableTd>{index + 1}</TableTd>
                  <TableTd>{language.code}</TableTd>
                  <TableTd>{language.name}</TableTd>
                  <TableTd>
                    <ActionIconGroup>
                      <PermissionGuard
                        allowedPermissions={[
                          "languages.update",
                          "languages.show",
                        ]}
                        operator="AND"
                      >
                        <Tooltip
                          label={t("languages.table.editLanguage")}
                          withArrow
                        >
                          <ActionIcon
                            variant="light"
                            size="lg"
                            color="blue"
                            aria-label={t("languages.table.editLanguage")}
                            component={Link}
                            href={`${APP_PATHS.dashboard.languages.edit(language.code)}`}
                          >
                            <IconPencil style={{width: rem(20)}} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard
                        allowedPermissions={["languages.delete"]}
                      >
                        <LanguageDeleteButton
                          code={language.code}
                          languageName={language.name}
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
      {languages.length >= 1 && (
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
