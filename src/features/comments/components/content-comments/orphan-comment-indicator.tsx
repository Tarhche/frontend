"use client";

import {Popover, ActionIcon, Text} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";

export function OrphanCommentIndicator() {
  const t = useTranslations();

  return (
    <Popover position="bottom" shadow="md" withArrow>
      <Popover.Target>
        <ActionIcon color="yellow" variant="transparent">
          <IconInfoCircle style={{width: "70%", height: "70%"}} stroke={1.5} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Text size="sm">{t("comments.list.orphanInfo")}</Text>
      </Popover.Dropdown>
    </Popover>
  );
}
