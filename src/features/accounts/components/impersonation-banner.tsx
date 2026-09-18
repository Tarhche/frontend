"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import {Alert, Button, Group, Text} from "@mantine/core";
import {IconEye} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {leaveImpersonation} from "../actions";

type Props = {
  /** who the dashboard is being seen as. */
  viewedAs: string;
  /** who is behind it, and the account to go back to. */
  impersonator: {uuid: string; name: string};
};

/**
 * Says whose dashboard this is, on every page of it.
 *
 * A shadow session looks exactly like the session of the person it stands for
 * — that is what makes it useful — so nothing else on the page would say that
 * what is done here is done as them.
 */
export function ImpersonationBanner({viewedAs, impersonator}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  return (
    <Alert
      color="orange"
      variant="light"
      icon={<IconEye />}
      title={t("accounts.impersonation.title", {name: viewedAs})}
      mb="md"
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm">{t("accounts.impersonation.text")}</Text>
        <Button
          size="xs"
          color="orange"
          variant="filled"
          loading={isPending}
          onClick={() => {
            startTransition(async () => {
              const {ok} = await leaveImpersonation(impersonator.uuid);
              queryClient.clear();

              if (!ok) {
                router.push("/auth/login");
                return;
              }

              router.refresh();
            });
          }}
        >
          {t("accounts.impersonation.leave", {name: impersonator.name})}
        </Button>
      </Group>
    </Alert>
  );
}
