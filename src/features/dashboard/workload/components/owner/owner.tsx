"use client";

import {Text, Tooltip} from "@mantine/core";
import {AuthorInline} from "@/features/authors/components/author-inline";
import {type Author} from "@/features/authors/types";
import {useTranslations} from "@/i18n/provider";

type Props = {
  /** whose it is: the uuid the API promises, and who that is when it says. */
  of: {owner_uuid?: string; owner?: Partial<Author> | null};

  /** who is looking: what is theirs is said to be theirs. */
  me?: string | null;
};

/**
 * Whose a VM, a snapshot, a stack or a container is, in a listing of
 * everybody's. The API says who that is beside the uuid; they are shown as
 * anybody else is, and one's own is said to be.
 */
export function Owner({of, me}: Props) {
  const t = useTranslations();

  if (me && of.owner_uuid === me) {
    return <Text size="sm">{t("workload.you")}</Text>;
  }

  if (of.owner?.uuid) {
    return <AuthorInline author={of.owner} size={28} />;
  }

  if (!of.owner_uuid) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Tooltip label={of.owner_uuid} withArrow>
      <Text size="xs" ff="monospace" c="dimmed">
        {of.owner_uuid.slice(0, 8)}
      </Text>
    </Tooltip>
  );
}
