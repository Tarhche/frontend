"use client";

import {useState, useEffect} from "react";
import Image from "next/image";
import {Box, Text, Group, Badge, Stack, Container} from "@mantine/core";
import {FILES_PUBLIC_URL} from "@/constants";
import Link from "@/components/link";
import {Grid, Title} from "@mantine/core";
import classes from "./element-featured.module.css";
import {formatDate} from "@/lib/date-and-time";

const MainFeaturedCard = ({item}) => {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(formatDate(item.published_at));
  }, [item.published_at]);

  return (
    <Box className={classes.featuredCard}>
      <Link
        href={`/articles/${item.slug ?? item.uuid}`}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <Image
          src={`${FILES_PUBLIC_URL}/${item.cover}`}
          alt={item.title}
          fill
          style={{objectFit: "cover"}}
          priority
          sizes="30vw"
        />
      </Link>

      <Box
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <Box
        style={{
          position: "absolute",
          bottom: "var(--mantine-spacing-lg)",
          left: "var(--mantine-spacing-lg)",
          right: "var(--mantine-spacing-lg)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <Stack gap={12}>
          <Link
            href={`/articles/${item.slug ?? item.uuid}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              pointerEvents: "auto",
            }}
          >
            <Title
              order={1}
              lineClamp={2}
              style={{
                color: "white",
                margin: 0,
                cursor: "pointer",
              }}
            >
              {item.title}
            </Title>
          </Link>

          {item.excerpt && (
            <Text
              size="md"
              lineClamp={2}
              style={{
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {item.excerpt}
            </Text>
          )}

          {item.tags && item.tags.length > 0 && (
            <Group
              gap="xs"
              style={{marginTop: "8px", pointerEvents: "auto"}}
              wrap="wrap"
            >
              {item.tags.map((tag, index) => (
                <Badge
                  key={`${tag}-${index}`}
                  size="sm"
                  variant="filled"
                  component={Link}
                  href={`/hashtags/${encodeURIComponent(tag)}`}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(4px)",
                    color: "white",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </Group>
          )}

          <Group gap="xs">
            {formattedDate && (
              <Text size="sm" style={{color: "rgba(255,255,255,0.8)"}}>
                {formattedDate}
              </Text>
            )}
          </Group>
        </Stack>
      </Box>
    </Box>
  );
};

const SideArticleItem = ({item}) => {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(formatDate(item.published_at));
  }, [item.published_at]);

  return (
    <Box
      style={{
        display: "flex",
        gap: "var(--mantine-spacing-sm)",
        padding: "0",
        transition: "background-color 0.2s ease",
        "&:hover": {
          backgroundColor: "var(--mantine-color-gray-0)",
        },
      }}
    >
      <Box
        component={Link}
        href={`/articles/${item.slug ?? item.uuid}`}
        style={{
          position: "relative",
          width: "20%",
          alignSelf: "stretch",
          overflow: "hidden",
          flexShrink: 0,
          textDecoration: "none",
        }}
      >
        <Image
          src={`${FILES_PUBLIC_URL}/${item.cover}`}
          alt={item.title}
          fill
          style={{objectFit: "cover"}}
          sizes="20vw"
        />
      </Box>

      <Stack gap="lg" style={{flex: 1, justifyContent: "space-between"}}>
        <Box>
          <Link
            href={`/articles/${item.slug ?? item.uuid}`}
            style={{
              textDecoration: "none",
            }}
          >
            <Title
              order={2}
              lineClamp={2}
              size="lg"
              style={{
                color: "var(--mantine-color-text)",
                cursor: "pointer",
                "&:hover": {
                  color: "var(--mantine-color-blue-6)",
                },
              }}
            >
              {item.title}
            </Title>
          </Link>

          {item?.excerpt && (
            <Text size="sm" c="gray.6" mt="sm" lineClamp={2}>
              {item.excerpt}
            </Text>
          )}
        </Box>

        <Box>
          {item?.tags && item.tags.length > 0 && (
            <Group
              gap="xs"
              style={{marginBottom: "var(--mantine-spacing-xs)"}}
              wrap="wrap"
            >
              {item.tags.map((tag, index) => (
                <Text
                  key={`${tag}-${index}`}
                  component={Link}
                  href={`/hashtags/${encodeURIComponent(tag)}`}
                  size="xs"
                  c="blue.6"
                  style={{
                    fontWeight: 500,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  #{tag}
                </Text>
              ))}
            </Group>
          )}

          <Group gap="xs">
            {item.published_at && (
              <Text size="xs" c="gray.6">
                {formattedDate}
              </Text>
            )}
          </Group>
        </Box>
      </Stack>
    </Box>
  );
};

const ElementFeatured = ({data}) => {
  if (
    !data?.body?.main ||
    !data?.body?.aside ||
    !Array.isArray(data.body.aside)
  ) {
    return null;
  }

  const {main, aside} = data.body;

  return (
    <Box
      style={{
        marginTop: "var(--mantine-spacing-xl)",
      }}
    >
      <Container size="lg" px={0}>
        <Grid gutter={24} align="stretch">
          <Grid.Col span={{base: 12, md: 7}}>
            <MainFeaturedCard item={main.body} />
          </Grid.Col>
          <Grid.Col span={{base: 12, md: 5}} style={{display: "flex"}}>
            <Stack gap="md" style={{flex: 1, justifyContent: "space-between"}}>
              {aside.slice(0, 3).map((item, index) => (
                <SideArticleItem
                  key={item?.body?.uuid || index}
                  item={item.body}
                />
              ))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default ElementFeatured;
