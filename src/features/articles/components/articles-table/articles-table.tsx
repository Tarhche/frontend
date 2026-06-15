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
import {ArticlesPagination} from "./articles-table-pagination";
import {ArticleDeleteButton} from "./article-delete-button";
import {
  IconEye,
  IconPencil,
  IconFilePlus,
  type TablerIcon,
} from "@tabler/icons-react";
import {fetchAllArticles} from "@/dal/private/articles";
import {formatDate, isGregorianStartDateTime} from "@/lib/date-and-time";
import {APP_PATHS} from "@/lib/app-paths";
import {type Permissions} from "@/lib/app-permissions";
import {AuthorInline} from "@/features/authors/components";
import {getServerDictionary} from "@/i18n/server";

type Props = {
  page: number | string;
  languageCode: string;
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
  title: string;
  cover: string;
  video: string;
  published_at: string;
  author: any;
  language: {code: string; name: string};
};

export async function ArticlesTable({page, languageCode}: Props) {
  const {t} = await getServerDictionary();

  const tableActions: TableAction[] = [
    {
      tooltipLabel: t("articles.table.viewArticle"),
      Icon: IconEye,
      color: "blue",
      allowedPermissions: [],
      href: (correlationUuid, code) =>
        `/${code}${APP_PATHS.articles.detail(correlationUuid)}`,
      disabled: (published: boolean) => published,
    },
    {
      tooltipLabel: t("articles.table.editArticle"),
      Icon: IconPencil,
      color: "blue",
      allowedPermissions: ["articles.update"],
      href: (correlationUuid, code) =>
        APP_PATHS.dashboard.articles.edit(correlationUuid, code),
      disabled: () => false,
    },
  ];

  const articlesResponse = await fetchAllArticles({
    params: {
      page: page,
      language_code: languageCode,
    },
  });

  const articles = articlesResponse.items;
  const {total_pages, current_page} = articlesResponse.pagination;

  return (
    <>
      <PermissionGuard allowedPermissions={["articles.create"]}>
        <Group justify="flex-end">
          <Button
            variant="light"
            component={Link}
            leftSection={<IconFilePlus />}
            href={APP_PATHS.dashboard.articles.new}
          >
            {t("articles.table.newArticle")}
          </Button>
        </Group>
      </PermissionGuard>

      {articles.length === 0 ? (
        <Text ta="center" c="dimmed" py="xl">
          {t("articles.table.empty")}
        </Text>
      ) : (
        <Accordion variant="separated" chevronPosition="left" mt="md" multiple>
          {articles.map((article: any) => {
            const items: CorrelatedItem[] = article.corrolated_items ?? [];
            const correlationUuid = article.correlation_uuid;
            // The row label is the first translation's title.
            const headerTitle = items[0]?.title ?? "—";

            return (
              <AccordionItem key={correlationUuid} value={correlationUuid}>
                <AccordionControl>
                  <Group gap="sm" wrap="nowrap">
                    <Text fw={500}>{headerTitle}</Text>
                    <Group gap={4} wrap="nowrap">
                      {items.map((item) => (
                        <Badge
                          key={item.language?.code}
                          variant="light"
                          color="gray"
                          size="sm"
                        >
                          {item.language?.name ?? item.language?.code}
                        </Badge>
                      ))}
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
                              {item.title}
                            </Text>
                            <AuthorInline author={item.author} />
                            {isPublished ? (
                              <Text size="sm" c="dimmed">
                                {formatDate(item.published_at)}
                              </Text>
                            ) : (
                              <Badge color="yellow" variant="light">
                                {t("articles.table.notPublished")}
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
                              allowedPermissions={["articles.delete"]}
                            >
                              <ArticleDeleteButton
                                correlationUuid={correlationUuid}
                                languageCode={itemLanguageCode}
                                articleTitle={item.title}
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

      {articles.length >= 1 && (
        <Group mt="md" mb="xl" justify="flex-end">
          <ArticlesPagination total={total_pages} current={current_page} />
        </Group>
      )}
    </>
  );
}
