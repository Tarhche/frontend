"use client";

import Link from "@/components/link";
import {Title, Text, Button, Container, Group} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import classes from "./not-found.module.css";

type Props = {
  title?: string;
  text?: string;
  anchorText?: string;
  anchorLink?: string;
};

export function NotFound({title, text, anchorLink, anchorText}: Props) {
  const t = useTranslations();
  return (
    <Container className={classes.root}>
      <div className={classes.label}>404</div>
      <Title className={classes.title}>
        {title ?? t("common.notFound.title")}
      </Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        {text ?? t("common.notFound.text")}
      </Text>
      <Group justify="center">
        <Button
          variant="subtle"
          size="md"
          component={Link}
          href={anchorLink ?? "/"}
        >
          {anchorText ?? t("common.notFound.takeMeHome")}
        </Button>
      </Group>
    </Container>
  );
}
