"use client";

import {Stack, Title} from "@mantine/core";
import {IconLock} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

export function PermissionDeniedError() {
  const t = useTranslations();
  return (
    <Stack align="center" justify="center" h="80%">
      <IconLock size={100} />
      <Title order={3}>{t("errors.permissionDenied")}</Title>
    </Stack>
  );
}
