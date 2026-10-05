"use client";

import {Badge, Tooltip} from "@mantine/core";
import {IconCode} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

/**
 * Says a VM is a snippet the code runner is running: one that can only be
 * stopped, deleted and read, and that is gone once the snippet has ended.
 */
export function CodeRunnerBadge() {
  const t = useTranslations();

  return (
    <Tooltip label={t("vms.codeRunner.help")} withArrow multiline maw={280}>
      <Badge
        variant="light"
        color="grape"
        miw="max-content"
        leftSection={<IconCode size={12} stroke={1.75} />}
      >
        {t("vms.codeRunner.badge")}
      </Badge>
    </Tooltip>
  );
}
