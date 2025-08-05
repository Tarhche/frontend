"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Box, Text, Group, Badge, Stack, Container } from "@mantine/core";
import { FILES_PUBLIC_URL } from "@/constants";
import Link from "next/link";
import { Grid, Title } from '@mantine/core';

const formatDateSafe = (dateString: string) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long", 
      day: "numeric",
    };
    
    // Check if we're on the client side and fa-IR locale is available
    if (typeof window !== 'undefined') {
      try {
        return date.toLocaleDateString("fa-IR", options);
      } catch (e) {
        // Fallback to default locale if fa-IR fails
        return date.toLocaleDateString("en-US", options);
      }
    }
    
    // Server-side fallback - use a consistent format
    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return "";
  }
};

const MainFeaturedCard = ({ itemType, item }) => {
  const [formattedDate, setFormattedDate] = useState("");
  
  useEffect(() => {
    setFormattedDate(formatDateSafe(item.published_at));
  }, [item.published_at]);

  return (
    <Box
      style={{
        position: 'relative',
        height: '100%',
        minHeight: '300px',
        overflow: 'hidden',
        '@media (minWidth: 768px)': {
          minHeight: '400px', // TODO: don't hardcode this
        },
      }}
    >
      <Link
        href={`/articles/${item.slug ?? item.uuid}`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <Image
          src={`${FILES_PUBLIC_URL}/${item.cover}`}
          alt={item.title}
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </Link>
      
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          right: '24px',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <Stack gap={12}>
          <Link
            href={`/articles/${item.slug ?? item.uuid}`}
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
                fontSize: '32px',
                fontWeight: 700,
                color: 'white',
                margin: 0,
                lineHeight: 1.2,
                cursor: 'pointer',
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
                color: 'rgba(255,255,255,0.9)',
                fontSize: '16px',
                margin: 0,
              }}
            >
              {item.excerpt}
            </Text>
          )}

          <Group gap="xs" style={{ marginTop: '8px' }}>
            {item.author.name && (
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                {item.author.name}
              </Text>
            )}
            {formattedDate && item.author.name && (
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                in
              </Text>
            )}
          </Group>

          {item.tags && item.tags.length > 0 && (
            <Group gap="xs" style={{ marginTop: '8px', pointerEvents: 'auto' }} wrap="wrap">
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
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {formattedDate}
              </Text>
            )}
          </Group>
        </Stack>
      </Box>
    </Box>
  );
};

const SideArticleItem = ({ itemType, item }) => {
  const [formattedDate, setFormattedDate] = useState("");
  
  useEffect(() => {
    setFormattedDate(formatDateSafe(item.published_at));
  }, [item.published_at]);

  return (
    <Box
      style={{
        display: 'flex',
        gap: 'var(--mantine-spacing-sm)',
        padding: '0',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: 'var(--mantine-color-gray-0)',
        }
      }}
    >
      <Box
        component={Link}
        href={`/articles/${item.slug ?? item.uuid}`}
        style={{
          position: 'relative',
          width: '20%',
          minHeight: '80px',
          alignSelf: 'stretch',
          overflow: 'hidden',
          flexShrink: 0,
          textDecoration: 'none',
        }}
      >
        <Image
          src={`${FILES_PUBLIC_URL}/${item.cover}`}
          alt={item.title}
          fill
          style={{ objectFit: 'cover' }}
          sizes="300px"
        />
      </Box>

      <Stack gap="lg" style={{ flex: 1, justifyContent: 'space-between' }}>
        <Box>
          <Link
            href={`/articles/${item.slug ?? item.uuid}`}
            style={{
              textDecoration: 'none',
            }}
          >
            <Title
              order={3}
              lineClamp={2}
              size="lg"
              style={{
                fontWeight: 600,
                margin: 0,
                lineHeight: 1.3,
                color: 'var(--mantine-color-dark-8)',
                cursor: 'pointer',
                '&:hover': {
                  color: 'var(--mantine-color-blue-6)',
                }
              }}
            >
              {item.title}
            </Title>
          </Link>

          {item?.excerpt && (
            <Text 
              size="xs" 
              c="gray.6"
              lineClamp={2}
              style={{ marginTop: 'var(--mantine-spacing-xs)' }}
            >
              {item.excerpt}
            </Text>
          )}
        </Box>

        <Box>
          {item?.tags && item.tags.length > 0 && (
            <Group gap="xs" style={{ marginBottom: 'var(--mantine-spacing-xs)' }} wrap="wrap">
              {item.tags.map((tag, index) => (
                <Text 
                  key={`${tag}-${index}`}
                  component={Link}
                  href={`/hashtags/${encodeURIComponent(tag)}`}
                  size="xs" 
                  c="blue.6"
                  style={{ 
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
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

const ElementFeatured = ({ data }) => {
  if (!data?.body?.main || !data?.body?.aside || !Array.isArray(data.body.aside)) return null;

  const { main, aside } = data.body; 

  console.log("aside", aside);

  return (
    <Box
      style={{
        marginTop: 'var(--mantine-spacing-xl)',
      }}
    >
      <Container size="lg" px={0}>
        <Grid gutter={24} align="stretch">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <MainFeaturedCard itemType={main.type} item={main.body} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }} style={{ display: 'flex' }}>
            <Stack gap="md" style={{ flex: 1, justifyContent: 'space-between' }}>
              {aside.slice(0, 3).map(
                (item, index) => (<SideArticleItem key={item?.body?.uuid || index} item={item.body} itemType={item.type} />)
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
};

export default ElementFeatured;