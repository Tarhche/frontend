import Image from "next/image";
import Link from "@/components/link";
import {Title, Box, Group, Text, Blockquote, Badge} from "@mantine/core";
import {ImageZoom} from "@/components/image-zoom";
import {parseArticleBodyToReact} from "@/features/articles/utils/article-body-parser";
import {BookmarkButton} from "./bookmark-button";
import {IconClockHour2, IconInfoCircle} from "@tabler/icons-react";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import {formatDate} from "@/lib/date-and-time";
import classes from "./content.module.css";
import {checkBookmarkStatus} from "@/dal/private/bookmarks";
import ArticleTags from "@/features/articles/components/article-tags/ArticleTags";
import {fetchArticleByUUID} from "@/dal/cacheable/articles";

type Props = {
  slug: string;
};

export async function Content({slug}: Props) {
  const [article, isBookmarked] = await Promise.all([
    fetchArticleByUUID(slug),
    checkBookmarkStatus(slug),
  ]);

  const tags = article?.status ?? [];
  const ARTICLE_COVER = `${FILES_PUBLIC_URL}/${article.cover}`;
  const ARTICLE_VIDEO = Boolean(article.video)
    ? `${FILES_PUBLIC_URL}/${article.video}`
    : undefined;

  return (
    <article>
      <Title order={2}>{article.title}</Title>
      <Group wrap="nowrap" c={"dimmed"} my={"sm"} justify="space-between">
        <Group gap={5}>
          <IconClockHour2 spacing={0} size={20} />
          <Text size="sm" c="dimmed" mt={4}>
            {formatDate(article.published_at)}
          </Text>
        </Group>
        {isBookmarked === undefined ? null : (
          <BookmarkButton
            uuid={article.uuid}
            isBookmarked={isBookmarked}
            title={article.title}
          />
        )}
      </Group>
      {article.video && (
        <video
          controls
          style={{
            width: "100%",
            height: "auto",
          }}
          poster={ARTICLE_COVER}
        >
          <source src={ARTICLE_VIDEO} />
        </video>
      )}
      {ARTICLE_VIDEO === undefined && (
        <ImageZoom classDialog={classes.rmiz}>
          <Image
            width={1920}
            height={1080}
            src={ARTICLE_COVER}
            alt={article.title}
          />
        </ImageZoom>
      )}
      <Blockquote
        color="blue"
        radius="md"
        iconSize={30}
        icon={<IconInfoCircle />}
        mt="md"
        mb="xl"
      >
        {article.excerpt}
      </Blockquote>
      <Box className={classes.content}>
        {parseArticleBodyToReact(article.body)}
      </Box>
      <Group gap={"xs"} mt={"md"}>
        {tags.map((tag: string) => {
          return (
            <Badge
              key={tag}
              variant="filled"
              size="lg"
              color="blue"
              radius="md"
              style={{cursor: "pointer"}}
              component={Link}
              href={`/hashtags/${tag}`}
            >
              {tag}#
            </Badge>
          );
        })}
      </Group>
      <ArticleTags tags={article.tags} />
    </article>
  );
}
