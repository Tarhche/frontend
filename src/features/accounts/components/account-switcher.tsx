"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import Link from "@/components/link";
import {
  UnstyledButton,
  Group,
  Menu,
  Text,
  Loader,
  Badge,
  rem,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronRight,
  IconEye,
  IconLogout,
  IconUserPlus,
} from "@tabler/icons-react";
import {notifications} from "@mantine/notifications";
import {UserAvatar} from "@/components/user-avatar";
import {useTranslations} from "@/i18n/provider";
import {signOutAccount, switchAccount} from "../actions";
import classes from "./account-switcher.module.css";

export type SwitchableAccount = {
  id: string;
  uuid: string;
  name?: string;
  username?: string;
  avatar?: string;
  /** set when the account is a session opened to be seen as somebody else. */
  impersonatorUuid?: string;
  impersonatorName?: string;
};

type Props = {
  accounts: SwitchableAccount[];
  activeId: string | null;
  addAccountHref: string;
};

/**
 * Who the dashboard is being used as, and who else it could be used as.
 *
 * Every session the browser is signed in to is listed here — signed in through
 * the login form, or opened to be seen as somebody else — and picking one makes
 * it the one in use. Cookies are the whole browser's, so this switches every
 * open tab, which is why the one in use is always named rather than assumed.
 */
export function AccountSwitcher({accounts, activeId, addAccountHref}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const active = accounts.find((account) => account.id === activeId);

  const run = (
    work: () => Promise<{signedIn?: boolean; ok?: boolean; expired?: boolean}>,
  ) => {
    startTransition(async () => {
      const result = await work();

      // an account whose session has run out is dropped from the list, which is
      // not something to discover by the list being one shorter
      if (result.expired) {
        notifications.show({
          title: t("accounts.expired.title"),
          message: t("accounts.expired.message"),
          color: "red",
        });
      }

      // everything the dashboard has fetched belongs to whoever it was fetched
      // as, so none of it survives the switch
      queryClient.clear();

      if (result.signedIn === false) {
        router.push("/");
        return;
      }

      router.refresh();
    });
  };

  return (
    <Menu shadow="md" width={280} position="top-start" withArrow>
      <Menu.Target>
        <UnstyledButton className={classes.account} disabled={isPending}>
          <Group wrap="nowrap" gap="sm">
            <UserAvatar
              width={38}
              height={38}
              userId={active?.uuid}
              src={active?.avatar}
            />
            <div style={{flex: 1, minWidth: 0}}>
              <Text size="sm" fw={500} truncate>
                {accountLabel(active, t("common.guestUser"))}
              </Text>
              {active?.impersonatorUuid ? (
                <Badge
                  size="xs"
                  color="orange"
                  variant="light"
                  leftSection={<IconEye size={10} />}
                >
                  {t("accounts.viewingAs")}
                </Badge>
              ) : (
                <Text c="dimmed" size="xs" truncate>
                  {active?.username}
                </Text>
              )}
            </div>
            {isPending ? (
              <Loader size="xs" />
            ) : (
              <IconChevronRight
                className={classes.chevron}
                style={{width: rem(16), height: rem(16)}}
                stroke={1.5}
              />
            )}
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t("accounts.signedInAccounts")}</Menu.Label>
        {accounts.map((account) => (
          <Menu.Item
            key={account.id}
            disabled={isPending}
            leftSection={
              <UserAvatar
                width={26}
                height={26}
                userId={account.uuid}
                src={account.avatar}
              />
            }
            rightSection={
              account.id === activeId ? (
                <IconCheck style={{width: rem(16), height: rem(16)}} />
              ) : null
            }
            onClick={() => {
              if (account.id !== activeId) {
                run(() => switchAccount(account.id));
              }
            }}
          >
            <Text size="sm" truncate>
              {accountLabel(account, account.uuid)}
            </Text>
            <Text c="dimmed" size="xs" truncate>
              {account.impersonatorUuid
                ? t("accounts.openedBy", {
                    name: account.impersonatorName ?? account.impersonatorUuid,
                  })
                : account.username}
            </Text>
          </Menu.Item>
        ))}

        <Menu.Divider />

        <Menu.Item
          component={Link}
          href={addAccountHref}
          leftSection={
            <IconUserPlus style={{width: rem(16), height: rem(16)}} />
          }
        >
          {t("accounts.addAccount")}
        </Menu.Item>

        {active ? (
          <Menu.Item
            color="red"
            disabled={isPending}
            leftSection={
              <IconLogout style={{width: rem(16), height: rem(16)}} />
            }
            onClick={() => run(() => signOutAccount(active.id))}
          >
            {t("dashboard.sidebar.logout")}
          </Menu.Item>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
}

function accountLabel(
  account: SwitchableAccount | undefined,
  fallback: string,
): string {
  return account?.name || account?.username || fallback;
}
