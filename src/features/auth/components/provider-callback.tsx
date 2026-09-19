"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import Link from "@/components/link";
import {Anchor, Center, Group, Loader, Paper, Stack, Text} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {useTranslations} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import {completeProviderLogin} from "../actions/provider-login";

type Props = {
  provider: string;
  // what the provider sent the browser back with. A refusal arrives as an
  // error and no code at all.
  code: string;
  state: string;
  refused: boolean;
};

/**
 * The moment the browser comes back from the provider.
 *
 * The code is spent here rather than in the address bar's own request: only the
 * server can trade it, and what it trades it for is a session cookie, which is
 * the server's to set. Once that is done the navigating is the router's, the
 * same as anywhere else in the app.
 */
export function ProviderCallback({provider, code, state, refused}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(refused || !code || !state);

  // a code is good once, and React runs an effect twice in development
  const spent = useRef(false);

  useEffect(() => {
    if (spent.current || refused || !code || !state) {
      return;
    }

    spent.current = true;

    completeProviderLogin(provider, code, state).then(({ok}) => {
      if (!ok) {
        setFailed(true);

        return;
      }

      // whatever is cached was fetched as whoever was here before
      queryClient.clear();
      router.replace(APP_PATHS.dashboard.index);
    });
  }, [provider, code, state, refused, router, queryClient]);

  return (
    <Center mih="60vh" px="md">
      <Paper withBorder shadow="md" p={30} radius="md" w={420} maw="100%">
        {failed ? (
          <Stack gap="md">
            <ValidationErrorsAlert
              errors={[t("auth.providers.callbackFailed")]}
              title={t("auth.shared.operationFailed")}
            />
            <Anchor component={Link} href={APP_PATHS.auth.login} size="sm">
              {t("auth.providers.backToLogin")}
            </Anchor>
          </Stack>
        ) : (
          <Group justify="center" gap="sm">
            <Loader size="sm" type="dots" />
            <Text size="sm">{t("auth.providers.signingIn")}</Text>
          </Group>
        )}
      </Paper>
    </Center>
  );
}
