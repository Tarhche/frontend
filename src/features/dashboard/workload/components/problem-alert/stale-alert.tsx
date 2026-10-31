"use client";

import {Alert, Button, Group, Text} from "@mantine/core";
import {IconRefreshAlert} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {problemMessage, problemOf} from "../../lib/problem";

type Props = {
  /** what the last read failed with. */
  error: unknown;

  /** offered beside it, since the next read is a few seconds away anyway. */
  onRetry?: () => void;
  retrying?: boolean;
};

/**
 * Said above what is shown when reading it again failed: it is what was read
 * last, and may be out of date. Whatever reads it again keeps doing so, so this
 * goes as soon as a read gets through.
 */
export function StaleAlert({error, onRetry, retrying}: Props) {
  const t = useTranslations();

  return (
    <Alert
      color="yellow"
      variant="light"
      role="status"
      icon={<IconRefreshAlert />}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm">
          {t("workload.errors.stale", {
            reason: problemMessage(problemOf(error), t),
          })}
        </Text>
        {onRetry && (
          <Button
            size="xs"
            variant="light"
            color="yellow"
            onClick={onRetry}
            loading={retrying}
          >
            {t("common.retry")}
          </Button>
        )}
      </Group>
    </Alert>
  );
}
