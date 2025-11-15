"use client";

import Image from "next/image";
import Link from "@/components/link";
import {FILES_PUBLIC_URL} from "@/constants/envs";
import {Grid, Card, Box, Stack, Text, Title} from "@mantine/core";
import classes from "./element-cards.module.css";
import {Carousel} from "@mantine/carousel";

export default function ElementCards({data}) {
  if (!data?.body?.items || !Array.isArray(data?.body?.items)) {
    return null;
  }

  const {is_carousel = false, title, items} = data.body;
  const hasTitle = typeof title === "string" && title.trim().length > 0;

  const cards = items.map((item) => {
    const article = item.body;
    const articleSlug = article.slug || article.uuid;
    const imageUrl = `${FILES_PUBLIC_URL}/${article.cover}`;

    return (
      <Card
        key={article.uuid}
        p={0}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "box-shadow 0.2s ease",
        }}
        styles={{
          root: {
            "&:hover": {
              boxShadow: "var(--mantine-shadow-md)",
            },
          },
        }}
      >
        <Box
          component={Link}
          href={`/articles/${articleSlug}`}
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            overflow: "hidden",
            backgroundColor: "var(--mantine-color-gray-1)",
            textDecoration: "none",
          }}
        >
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            style={{
              objectFit: "cover",
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Box>
        <Stack gap="sm" p={{base: "md", md: "lg"}} style={{flex: 1}}>
          <Link
            href={`/articles/${articleSlug}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Title
              order={3}
              size="h4"
              fw={600}
              lineClamp={2}
              style={{
                color: "var(--mantine-color-text)",
                cursor: "pointer",
              }}
              styles={{
                root: {
                  "&:hover": {
                    color: "var(--mantine-color-gray-7)",
                  },
                },
              }}
            >
              {article.title}
            </Title>
          </Link>
          <Text size="sm" c="dimmed" lineClamp={3} style={{flex: 1}}>
            {article.excerpt}
          </Text>
        </Stack>
      </Card>
    );
  });

  return (
    <>
      {hasTitle && (
        <h2 className={classes.headingWithBorder}>
          <span>{title}</span>
        </h2>
      )}

      {is_carousel === true ? (
        <Carousel
          mt={hasTitle ? "0" : "lg"}
          withIndicators
          height="100%"
          slideSize={{base: "100%", sm: "50%", md: "25%"}}
          slideGap={{base: 0, sm: "md"}}
          emblaOptions={{loop: true, align: "start"}}
        >
          {cards.map((card, index) => (
            <Carousel.Slide key={index}>{card}</Carousel.Slide>
          ))}
        </Carousel>
      ) : (
        <Grid mt={hasTitle ? "0" : "lg"} gutter={{base: "md", md: "lg"}}>
          {cards.map((card, index) => (
            <Grid.Col key={index} span={{base: 12, md: 6, lg: 3}}>
              {card}
            </Grid.Col>
          ))}
        </Grid>
      )}
    </>
  );
}
