import Link from "@/components/link";
import {ActionIcon, Tooltip, rem} from "@mantine/core";
import {IconEye} from "@tabler/icons-react";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

type Props = {
  userID: string;
  username?: string;
};

/**
 * Opens the dashboard as this user, in a new tab.
 *
 * A link rather than a button that posts: a tab opened after an awaited action
 * is a popup as far as the browser is concerned, and gets blocked. The route it
 * points at is what obtains the session, and only for a navigation somebody
 * made — not for a prefetch, and not for a page on another site.
 */
export async function ImpersonateButton({userID, username}: Props) {
  const {t} = await getServerDictionary();
  const label = t("users.table.impersonate", {title: username ?? ""});

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="light"
        size="lg"
        color="orange"
        aria-label={label}
        component={Link}
        href={APP_PATHS.dashboard.users.impersonate(userID)}
        target="_blank"
        rel="noopener"
        // the link opens a session; hovering over it must not
        prefetch={false}
      >
        <IconEye style={{width: rem(20)}} stroke={1.5} />
      </ActionIcon>
    </Tooltip>
  );
}
