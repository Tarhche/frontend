"use client";

import {Badge} from "@mantine/core";
import {IconBrandDocker, IconServer2} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {type VmKind} from "../types";

/** Which kind a VM is, at a glance. */
export function VmKindBadge({kind}: {kind: VmKind}) {
  const t = useTranslations();
  const Icon = kind === "docker" ? IconBrandDocker : IconServer2;

  return (
    <Badge
      variant="outline"
      color={kind === "docker" ? "cyan" : "gray"}
      miw="max-content"
      leftSection={<Icon size={12} stroke={1.75} />}
    >
      {t(`vms.kinds.${kind}`)}
    </Badge>
  );
}
