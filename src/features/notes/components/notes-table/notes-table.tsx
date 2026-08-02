import Link from "@/components/link";
import {
  Accordion,
  AccordionItem,
  AccordionControl,
  AccordionPanel,
  ActionIcon,
  ActionIconGroup,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  rem,
  type MantineColor,
} from "@mantine/core";
import {PermissionGuard} from "@/components/permission-guard";
import {NotesPagination} from "./notes-table-pagination";
import {NoteDeleteButton} from "./note-delete-button";
import {
  IconEye,
  IconPencil,
  IconFilePlus,
  IconCircleCheckFilled,
  type TablerIcon,
} from "@tabler/icons-react";
import {fetchAllNotes, type NotesScope} from "@/dal/private/notes";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {type Permissions} from "@/lib/app-permissions";
import {AuthorInline} from "@/features/authors/components";
import {noteExcerpt} from "../../utils/note-excerpt";
import {getServerDictionary} from "@/i18n/server";

type Props = {
  page: number | string;
  languageCode: string;
  // "all" lists every author's notes (global notes permissions); "own" lists
  // only the current user's (self notes permissions).
  scope: NotesScope;
};

type TableAction = {
  tooltipLabel: string;
  Icon: TablerIcon;
  color: MantineColor;
  allowedPermissions: Permissions[];
  href: (correlationUuid: string, languageCode: string) => string;
  disabled: (...args: any[]) => boolean;
};

type CorrelatedItem = {
  body: string;
  published_at: string;
  author: any;
  language: {code: string; name: string};
};

export async function NotesTable({page, languageCode, scope}: Props) {
  const {t} = await getServerDictionary();
  const isOwnScope = scope === "own";
  const paths = isOwnScope
    ? APP_PATHS.dashboard.my.notes
    : APP_PATHS.dashboard.notes;

  const tableActions: TableAction[] = [
    {
      tooltipLabel: t("notes.table.viewNote"),
      Icon: IconEye,
      color: "blue",
      allowedPermissions: [],
      href: (correlationUuid, code) =>
        `/${code}${APP_PATHS.notes.detail(correlationUuid)}`,
      disabled: (published: boolean) => published,
    },
    {
      tooltipLabel: t("notes.table.editNote"),
      Icon: IconPencil,
      color: "blue",
      allowedPermissions: [isOwnScope ? "self.notes.update" : "notes.update"],
      href: (correlationUuid, code) => paths.edit(correlationUuid, code),
      disabled: () => false,
    },
  ];

  const notesResponse = await fetchAllNotes(scope, {
    params: {
      page: page,
    },
    headers: {[LANGUAGE_CODE_HEADER]: languageCode},
  });

  const notes = notesResponse.items;
  const {total_pages, current_page} = notesResponse.pagination;

  return (
    <>
      <PermissionGuard
        allowedPermissions={[isOwnScope ? "self.notes.create" : "notes.create"]}
      >
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconFilePlus />}
            href={paths.new}
          >
            {t("notes.table.newNote")}
          </Button>
        </Group>
      </PermissionGuard>

      {notes.length === 0 ? (
        <Text ta="center" c="dimmed" py="xl">
          {t("notes.table.empty")}
        </Text>
      ) : (
        <Accordion variant="separated" chevronPosition="left" mt="md" multiple>
          {notes.map((note: any) => {
            const items: CorrelatedItem[] = note.corrolated_items ?? [];
            const correlationUuid = note.correlation_uuid;
            // Notes have no title, so the row label is the opening line of the
            // first translation's body.
            const headerTitle =
              noteExcerpt(items[0]?.body ?? "", 1).excerpt || "—";

            return (
              <AccordionItem key={correlationUuid} value={correlationUuid}>
                <AccordionControl>
                  <Group gap="sm" wrap="nowrap">
                    <Text fw={500} lineClamp={1}>
                      {headerTitle}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      {items.map((item) => {
                        const isPublished = !isGregorianStartDateTime(
                          item.published_at,
                        );

                        return (
                          <Badge
                            key={item.language?.code}
                            variant="light"
                            color="gray"
                            size="sm"
                            rightSection={
                              isPublished ? (
                                <IconCircleCheckFilled
                                  size={12}
                                  color="var(--mantine-color-green-6)"
                                  aria-label={t("notes.table.published")}
                                />
                              ) : null
                            }
                          >
                            {item.language?.name ?? item.language?.code}
                          </Badge>
                        );
                      })}
                    </Group>
                  </Group>
                </AccordionControl>
                <AccordionPanel>
                  <Stack gap="xs">
                    {items.map((item) => {
                      const itemLanguageCode = item.language?.code ?? "";
                      const isPublished = !isGregorianStartDateTime(
                        item.published_at,
                      );

                      return (
                        <Group
                          key={itemLanguageCode}
                          justify="space-between"
                          wrap="nowrap"
                          gap="md"
                          p="xs"
                          style={{borderRadius: "var(--mantine-radius-sm)"}}
                          bg="var(--mantine-color-default-hover)"
                        >
                          <Group gap="md" wrap="nowrap">
                            <Badge variant="light">
                              {item.language?.name ?? itemLanguageCode}
                            </Badge>
                            <Text size="sm" lineClamp={1}>
                              {noteExcerpt(item.body, 1).excerpt}
                            </Text>
                            <AuthorInline author={item.author} />
                            {isPublished ? (
                              <Text size="sm" c="dimmed">
                                {formatDate(item.published_at)}
                              </Text>
                            ) : (
                              <Badge color="yellow" variant="light">
                                {t("notes.table.notPublished")}
                              </Badge>
                            )}
                          </Group>
                          <ActionIconGroup>
                            {tableActions.map(
                              ({
                                Icon,
                                tooltipLabel,
                                color,
                                href,
                                allowedPermissions,
                                disabled,
                              }) => (
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
                                      href={href(
                                        correlationUuid,
                                        itemLanguageCode,
                                      )}
                                      disabled={disabled(isPublished === false)}
                                      aria-label={tooltipLabel}
                                    >
                                      <Icon
                                        style={{width: rem(20)}}
                                        stroke={1.5}
                                      />
                                    </ActionIcon>
                                  </Tooltip>
                                </PermissionGuard>
                              ),
                            )}
                            <PermissionGuard
                              allowedPermissions={[
                                isOwnScope
                                  ? "self.notes.delete"
                                  : "notes.delete",
                              ]}
                            >
                              <NoteDeleteButton
                                correlationUuid={correlationUuid}
                                languageCode={itemLanguageCode}
                                scope={scope}
                              />
                            </PermissionGuard>
                          </ActionIconGroup>
                        </Group>
                      );
                    })}
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {notes.length >= 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <NotesPagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
