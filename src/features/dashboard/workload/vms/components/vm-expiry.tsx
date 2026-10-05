"use client";

import {Text, Tooltip} from "@mantine/core";
import {useI18n} from "@/i18n/provider";
import {useNow} from "../hooks/use-now";
import {expiryOf, formatDateTime, formatRelative} from "../lib/lifetime";
import {type Vm} from "../types";

/** When a VM will be deleted, or that it is kept until somebody deletes it. */
export function VmExpiry({
  vm,
}: {
  vm: Pick<Vm, "lifetime_seconds" | "expires_at">;
}) {
  const {t, locale} = useI18n();
  const now = useNow();
  const at = expiryOf(vm);

  if (at === null) {
    return (
      <Text size="sm" c="dimmed">
        {t("vms.expiry.never")}
      </Text>
    );
  }

  return (
    <Tooltip label={formatDateTime(at, locale)} withArrow>
      <Text size="sm" component="span">
        {at.getTime() <= now
          ? t("vms.expiry.due")
          : formatRelative(at, new Date(now), locale)}
      </Text>
    </Tooltip>
  );
}
