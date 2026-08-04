"use client";

import {useOptimistic, useTransition} from "react";
import {Switch, Tooltip} from "@mantine/core";
import {useTranslations} from "@/i18n/provider";
import {markContactMessageAsReadAction} from "../../actions/mark-as-read";

type Props = {
  uuid: string;
  isRead: boolean;
};

// The read flag is a toggle rather than a one-way "mark as read", so a message
// opened by mistake can go back to the unread pile.
//
// What the switch shows is always the server's `isRead`; `useOptimistic` only
// covers the round trip, and the revalidated row takes over the moment it lands.
// Holding the flag in client state instead lets the switch and the row it sits
// in drift apart, since only one of the two would see the new data.
export function ReadToggle({uuid, isRead}: Props) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [optimisticRead, setOptimisticRead] = useOptimistic(isRead);

  const label = optimisticRead
    ? t("contactUs.table.markAsUnread")
    : t("contactUs.table.markAsRead");

  return (
    <Tooltip label={label} withArrow>
      <Switch
        checked={optimisticRead}
        // Toggling is disabled until the write settles, so two quick flips can't
        // land out of order and leave the row on the wrong one.
        disabled={isPending}
        aria-label={label}
        onChange={(event) => {
          const read = event.currentTarget.checked;
          startTransition(async () => {
            setOptimisticRead(read);
            await markContactMessageAsReadAction(uuid, read);
          });
        }}
      />
    </Tooltip>
  );
}
