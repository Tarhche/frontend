"use client";

import {Title, Text, Container} from "@mantine/core";
import {IconInbox} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import classes from "./no-content.module.css";

type Props = {
  title?: string;
  text?: string;
};

export function NoContent({title, text}: Props) {
  const t = useTranslations();
  return (
    <Container className={classes.root}>
      <IconInbox className={classes.icon} stroke={1.25} />
      <Title className={classes.title}>
        {title ?? t("common.noContent.title")}
      </Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        {text ?? t("common.noContent.text")}
      </Text>
    </Container>
  );
}
