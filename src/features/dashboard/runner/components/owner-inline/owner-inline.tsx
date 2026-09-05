"use client";

import {Group, Text} from "@mantine/core";
import {UserAvatar} from "@/components/user-avatar";
import {AuthorInline} from "@/features/authors/components/author-inline";
import {type Author} from "@/features/authors/types";
import {useTranslations} from "@/i18n/provider";

type Props = {
  owner?: Partial<Author> | null;
  size?: number;
};

/**
 * Who a container or a stack belongs to.
 *
 * Not all of them belong to somebody: the code runner on the public pages
 * starts a container for whoever is reading, signed in or not, and those are
 * shown as the guest they were asked for by rather than as a blank.
 */
export function OwnerInline({owner, size = 28}: Props) {
  const t = useTranslations();

  if (owner?.uuid) {
    return <AuthorInline author={owner} size={size} />;
  }

  return (
    <Group gap={"sm"} wrap="nowrap">
      <UserAvatar width={size} height={size} />
      <Text size="sm" c="dimmed">
        {t("common.guestUser")}
      </Text>
    </Group>
  );
}
