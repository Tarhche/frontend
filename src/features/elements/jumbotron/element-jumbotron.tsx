"use client";

import React from "react";
import Image from "next/image";
import { Box, Text, Group, Badge, Overlay, Stack } from "@mantine/core";
import { FILES_PUBLIC_URL } from "@/constants";
import Link from "next/link";
import { Grid, Title } from '@mantine/core';

const ElementJumbotron = ({ data }) => {
  if (!data?.body?.body) return null;

  const article = data.body.body as any;
  const { cover, title, excerpt, published_at, tags = [], author = {} } : any = article;

  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "";

  const renderBadges = () =>
    tags.map((tag) => (
      <Badge
        key={tag}
        size="sm"
        radius="xl"
        variant="filled"
        component={Link}
        href={`/hashtags/${encodeURIComponent(tag)}`}
        style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(4px)",
          color: "var(--mantine-color-white)",
          cursor: "pointer",
          textDecoration: "none",
        }}
      >
        {tag}
      </Badge>
    ));

  const renderMeta = () => (
    <Group gap="xs" fz={{ base: "xs", sm: "sm" }} c="dimmed" wrap="nowrap">
      {author.name && (
        <>
          <Text component="span" fw={600}>
            {author.name}
          </Text>
          {formattedDate && <Text component="span">·</Text>}
        </>
      )}
      {formattedDate && (
        <Text size="sm" component="time" style={{ color: 'var(--mantine-color-gray-6)', margin: 0}} dateTime={published_at}>
          {formattedDate}
        </Text>
      )}
    </Group>
  );

  return (
    <Box
      style={{
        backgroundColor: 'var(--mantine-color-gray-0)',
        overflow: 'hidden',
        marginTop: 'var(--mantine-spacing-xl)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 'var(--mantine-shadow-md)',
        }
      }}
    >
      <Box hiddenFrom="md" style={{ position: 'relative', minHeight: '300px' }}>
        <Link
          href={`/articles/${article.slug ?? article.uuid}`}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Image
            src={`${FILES_PUBLIC_URL}/${cover}`}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="100vw"
            priority
          />
        </Link>
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: 'var(--mantine-spacing-lg)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <Stack gap={8} style={{ width: '100%' }}>
            <Link
              href={`/articles/${article.slug ?? article.uuid}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                pointerEvents: 'auto',
              }}
            >
              <Title
                order={1}
                lineClamp={2}
                style={{
                  fontSize: '24px',
                  margin: 0,
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {title}
              </Title>
            </Link>

            {excerpt && (
              <Text
                style={{ 
                  opacity: 0.9, 
                  marginBottom: "var(--mantine-spacing-sm)", 
                  fontSize: '90%',
                  color: 'white'
                }}
                lineClamp={2}
              >
                {excerpt}
              </Text>
            )}

            <Group gap="xs" wrap="wrap" style={{ pointerEvents: 'auto' }}>
              {tags.length > 0 && renderBadges()}
              {renderMeta()}
            </Group>
          </Stack>
        </Box>
      </Box>

      <Grid gutter={0} align="stretch" style={{ margin: 0 }} visibleFrom="md">
        <Grid.Col span={{ md: 6, lg: 5 }} style={{ padding: 0 }}>
          <Box
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Link
              href={`/articles/${article.slug ?? article.uuid}`}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                textDecoration: 'none',
              }}
            >
              <Image
                src={`${FILES_PUBLIC_URL}/${cover}`}
                alt={title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 62em) 50vw, 30vw"
                priority
              />
            </Link>

            {tags.length > 0 && (
              <Box
                style={{
                  position: 'absolute',
                  top: 'var(--mantine-spacing-md)',
                  left: 'var(--mantine-spacing-md)',
                  zIndex: 1,
                }}
              >
                <Group gap="xs" wrap="wrap">
                  {renderBadges()}
                </Group>
              </Box>
            )}
          </Box>
        </Grid.Col>

        <Grid.Col span={{ md: 6, lg: 7 }} style={{ padding: 'var(--mantine-spacing-xl)' }}>
          <Stack gap={12} style={{ height: '100%' }} justify="flex-start">
            <Link
              href={`/articles/${article.slug ?? article.uuid}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <Title
                order={1}
                lineClamp={2}
                style={{
                  margin: 0,
                  marginBottom: 'var(--mantine-spacing-xs)',
                  cursor: 'pointer',
                }}
              >
                {title}
              </Title>
            </Link>

            {excerpt && (
              <Text
                style={{ color: 'var(--mantine-color-gray-6)', marginBottom: "var(--mantine-spacing-md)" }}
                lineClamp={3}
              >
                {excerpt}
              </Text>
            )}

            <>
              {renderMeta()}
            </>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default ElementJumbotron;
