"use client";

import {Anchor, Box, Group, Text} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

export default function Footer() {
  const t = useTranslations();
  return (
    <Box
      py="lg"
      px="0"
      mt="xl"
      style={{borderTop: "1px solid var(--mantine-color-gray-3)"}}
    >
      <Group justify="space-between" wrap="wrap">
        <Anchor
          href="https://tarhche.com"
          c="gray.7"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.1rem",
          }}
        >
          <Text span size="sm">
            {t("footer.tagline")}
          </Text>
        </Anchor>

        <Anchor
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/Tarhche"
          c="gray.7"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.1rem",
          }}
        >
          <IconBrandGithub size="2rem" />
          <Text span size="sm">
            {t("footer.openSource")}
          </Text>
        </Anchor>
      </Group>
    </Box>
  );
}
