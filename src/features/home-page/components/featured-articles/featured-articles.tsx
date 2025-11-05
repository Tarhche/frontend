import Link from "next/link";
import {
  Stack,
  Grid,
  GridCol,
  List,
  ThemeIcon,
  ListItem,
  Title,
  Group,
  Button,
} from "@mantine/core";
import {VerticalArticleCard} from "../article-card-vertical";
import classes from "./featured-articles.module.css";
import {
  IconArrowLeft,
  IconHexagon1,
  IconHexagon2,
  IconHexagon3,
  IconHexagon4,
  IconHexagon5,
  IconHexagon6,
  IconHexagon7,
  IconHexagon8,
  IconHexagon9,
} from "@tabler/icons-react";

export async function FeaturedArticles({latestArticles, popularArticles}) {
  const hexagonIcons = [
    IconHexagon1,
    IconHexagon2,
    IconHexagon3,
    IconHexagon4,
    IconHexagon5,
    IconHexagon6,
    IconHexagon7,
    IconHexagon8,
    IconHexagon9,
  ];

  return (
    <Grid>
      <GridCol
        span={{
          base: 12,
          md: 8,
        }}
      >
        <h2 className={classes.headingWithBorder}>
          <span>جدیدترین ها</span>
        </h2>
        <Stack gap={"sm"}>
          {latestArticles.map((la) => {
            return (
              <VerticalArticleCard
                key={la.uuid}
                article={{
                  thumbnail: la.cover,
                  title: la.title,
                  subtitle: la.excerpt,
                  publishedDate: la.published_at,
                  slug: la.uuid,
                  tags: la.tags,
                }}
              />
            );
          })}
        </Stack>
      </GridCol>
      <GridCol
        span={{
          base: 12,
          md: 4,
        }}
      >
        <h2 className={classes.headingWithBorder}>
          <span>پربازدیدترین ها</span>
        </h2>
        <Stack gap={"sm"}>
          <List>
            {popularArticles.slice(0, hexagonIcons.length).map((article, index) => {
              const Icon = hexagonIcons[index];

              return (
                <ListItem
                  mb={"sm"}
                  key={article.uuid}
                  icon={<ThemeIcon color="teal" radius="xl" size="md"><Icon size="xl" /></ThemeIcon>}
                >
                  <Link style={{textDecoration: "none", color: "inherit"}} href={`articles/${article.uuid}`}>
                    <Title size="md" order={3}>{article.title}</Title>
                  </Link>
                </ListItem>
              );
            })}
          </List>
        </Stack>
      </GridCol>
      <GridCol
        mt={10}
        span={{
          base: 12,
          md: 12,
        }}
      >
        <Group justify="center">
          <Button
            component={Link}
            scroll={true}
            href="/articles"
            size="md"
            radius="sm"
            rightSection={<IconArrowLeft size={18} />}
            styles={{ section: { marginInlineStart: 8 } }}
          >
            مقالات بیشتر
          </Button>
        </Group>
      </GridCol>
    </Grid>
  );
}
