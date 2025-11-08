import Link from "next/link";
import Image from "next/image";
import {Card, Text, Group, Box, Flex, Badge} from "@mantine/core";
import { IconClockHour2 } from "@tabler/icons-react";
import {formatDate} from "@/lib/date-and-time";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import classes from "./card.module.css";

type Props = {
  article: {
    thumbnail: string;
    title: string;
    subtitle: string;
    publishedDate: string;
    slug: string;
    tags: string[];
  };
};

export function VerticalArticleCard({article}: Props) {
  return (
    <Card p={0} className={classes.card} radius="0">
      <Flex gap={0} className={classes.group}>
        <Box className={classes.imageWrapper}>
          {article.tags && article.tags.length > 0 && (
            <div className={classes.tagsOverlay}>
              {article.tags.slice(0, 2).map((tag, index) => (
                <Badge
                  key={`${tag}-${index}`}
                  size="xs"
                  variant="light"
                  color="white"
                  component={Link}
                  style={{cursor: "pointer", textDecoration: "none"}}
                  href={`/hashtags/${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <Image
            fill
            src={`${FILES_PUBLIC_URL}/${article.thumbnail}`}
            alt={article.title}
            style={{
              objectFit: "cover",
            }}
            sizes="300px"
          />
        </Box>
        <Box className={classes.body}>
          <Text
            mt="xs"
            size="md"
            fw="bold"
            component={Link}
            href={`/articles/${article.slug}`}
          >
            {article.title}
          </Text>
          <Text size="sm" c={"dimmed"} mt={5} mb="md" lineClamp={3}>
            {article.subtitle}
          </Text>

          {/* tags moved to image overlay */}

          <Group wrap="nowrap" gap={5} c={"dimmed"}>
            <IconClockHour2 spacing={0} size="1rem" />
            <Text size="xs" c="dimmed">
              {formatDate(article.publishedDate)}
            </Text>
          </Group>
        </Box>
      </Flex>
    </Card>
  );
}
