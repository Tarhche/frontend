"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {ActionIcon, Tooltip, rem} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {IconEye} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {impersonate} from "@/features/accounts/actions";
import {APP_PATHS} from "@/lib/app-paths";

type Props = {
  userID: string;
  username?: string;
};

/**
 * Opens the dashboard as this user, in a new tab.
 *
 * The tab is opened on the click itself and pointed somewhere once the session
 * exists: a tab opened after an awaited action is a popup as far as the browser
 * is concerned, and gets blocked.
 *
 * This tab follows it to the dashboard. Cookies belong to the browser rather
 * than the tab, so this one is signed in as them too, and a users list it is no
 * longer allowed to read is a worse thing to be left looking at than the
 * dashboard the band explains. It is also where the whole thing lands when the
 * browser refuses the new tab.
 */
export function ImpersonateButton({userID, username}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const label = t("users.table.impersonate", {title: username ?? ""});

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="light"
        size="lg"
        color="orange"
        aria-label={label}
        loading={isPending}
        onClick={() => {
          const tab = window.open("", "_blank");

          startTransition(async () => {
            const {ok, name} = await impersonate(userID);

            if (!ok) {
              tab?.close();
              notifications.show({
                title: t("errors.errorTitle"),
                message: t("users.table.impersonationFailed"),
                color: "red",
              });

              return;
            }

            notifications.show({
              title: t("users.table.impersonationOpened", {
                title: name ?? username ?? "",
              }),
              message: t("users.table.impersonationShared"),
              color: "orange",
            });

            if (tab) {
              tab.location.href = APP_PATHS.dashboard.index;
            }

            router.push(APP_PATHS.dashboard.index);
          });
        }}
      >
        <IconEye style={{width: rem(20)}} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
}
