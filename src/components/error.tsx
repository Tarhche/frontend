"use client";

import {Title, Text, Button, Container, Group} from "@mantine/core";
import {IconRefresh, IconMoodSadDizzy} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import classes from "./error.module.css";

type Props = {
  onReset: () => void;
};

export function Error({onReset}: Props) {
  const t = useTranslations();
  return (
    <div className={classes.root}>
      <Container>
        <div className={classes.label}>
          <IconMoodSadDizzy size={150} />
        </div>
        <Title className={classes.title}>{t("errors.title")}</Title>
        <Text size="lg" ta="center" className={classes.description}>
          {t("errors.boundaryText")}
        </Text>
        <Group justify="center">
          <Button
            variant="subtle"
            size="md"
            leftSection={<IconRefresh />}
            onClick={onReset}
          >
            {t("common.tryAgain")}
          </Button>
        </Group>
      </Container>
    </div>
  );
}
