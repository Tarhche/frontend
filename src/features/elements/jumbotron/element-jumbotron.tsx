"use client";

import React from "react";
import Image from "next/image";
import { Box, Text, Group, Badge, Overlay } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FILES_PUBLIC_URL } from "@/constants";
import Link from "next/link";

const ElementJumbotron = ({ data, style }) => {
  const isMobile = useMediaQuery("(max-width: 48em)");

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
        size="xs"
        radius="xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(4px)",
          color: "#fff",
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
        <Text component="time" dateTime={published_at}>
          {formattedDate}
        </Text>
      )}
    </Group>
  );

  return (
    <Box
      component={Link}
      href={`/articles/${article.slug ?? article.uuid}`}
      pos="relative"
      w="100%"
      h={{ base: 240, sm: 280, md: 320, lg: 360, xl: 400 }}
      style={{
        display: 'block',
        borderRadius: "var(--mantine-radius-xl)",
        overflow: "hidden",
        boxShadow: "var(--mantine-shadow-xl)",
        direction: "rtl",
        ...style,
      }}
    >
      <Image
        src={`${FILES_PUBLIC_URL}/${cover}`}
        alt={title}
        fill
        sizes="(max-width: 48em) 100vw, 100vw"
        style={{ objectFit: "cover" }}
        priority
      />

      <Overlay
        gradient="linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.8) 100%)"
        zIndex={0}
      />

      <Box
        style={{
          position: "absolute",
          insetInlineStart: 0,
          insetInlineEnd: 0,
          bottom: 0,
          padding: isMobile ? "var(--mantine-spacing-md)" : "var(--mantine-spacing-lg)",
          color: "var(--mantine-color-white)",
          zIndex: 1,
        }}
      >
        <Text
          component="h1"
          fz={{ base: 20, sm: 24, md: 28, lg: 32 }}
          fw={700}
          lh={1.3}
          mb="var(--mantine-spacing-sm)"
          style={{ wordBreak: "break-word" }}
        >
          {title}
        </Text>

        {excerpt && (
          <Text
            style={{ opacity: 0.9, marginBottom: "var(--mantine-spacing-md)", fontSize: isMobile ? '90%' : '100%' }}
            lineClamp={3}
          >
            {excerpt}
          </Text>
        )}

        {isMobile ? (
          <Group gap="xs" mb="0" wrap="wrap">
            {tags.length > 0 && renderBadges()}
            {renderMeta()}
          </Group>
        ) : (
          <>
            {tags.length > 0 && (
              <Group gap="xs" mb="md" wrap="wrap">
                {renderBadges()}
              </Group>
            )}
            {renderMeta()}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ElementJumbotron;
