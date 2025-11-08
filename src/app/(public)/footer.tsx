import {Anchor, Box, Group, Text} from "@mantine/core";
import {IconBrandGithub} from "@tabler/icons-react";

export default function Footer() {
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
            طرح‌چه | طرحی نو در اندازیم
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
            اوپن سورس
          </Text>
        </Anchor>
      </Group>
    </Box>
  );
}
