"use client";

import {Anchor, Box, Group, Text} from "@mantine/core";
import {IconBrandGithub, IconMail} from "@tabler/icons-react";
import Link from "@/components/link";
import {APP_PATHS} from "@/lib/app-paths";
import {useTranslations} from "@/i18n/provider";

// Every footer link reads as plain text with its icon and label on one line.
const linkStyle = {
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "0.3rem",
};

export default function Footer() {
  const t = useTranslations();

  return (
    <Box
      component="footer"
      py="lg"
      px="0"
      mt="xl"
      style={{borderTop: "1px solid var(--mantine-color-gray-3)"}}
    >
      {/* The document's `dir` flips the row, so the first child lands on the
          inline start — the right in Farsi, the left in English — and the rest
          cluster on the opposite edge. No per-language positioning needed. */}
      <Group justify="space-between" wrap="wrap" gap="md">
        <Group wrap="wrap" gap="lg">
          <Anchor
            component={Link}
            href={APP_PATHS.contactUs}
            c="gray.7"
            style={linkStyle}
          >
            <IconMail size="1.3rem" stroke={1.5} />
            <Text span size="sm">
              {t("footer.contactUs")}
            </Text>
          </Anchor>

          <Anchor
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/Tarhche"
            c="gray.7"
            style={linkStyle}
          >
            <IconBrandGithub size="1.6rem" stroke={1.5} />
            <Text span size="sm">
              {t("footer.openSource")}
            </Text>
          </Anchor>
        </Group>

        <Anchor href="https://tarhche.com" c="gray.7" style={linkStyle}>
          <Text span size="sm">
            {t("footer.tagline")}
          </Text>
        </Anchor>
      </Group>
    </Box>
  );
}
