"use client";

import {useActionState, useEffect} from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  List,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconPlugConnected,
} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {leaveFor} from "@/lib/navigate";
import {answerAuthorization} from "../actions/answer-authorization";

type Props = {
  // request is the authorization request as the backend signed it. It is
  // passed straight back: this page changes nothing about what was asked.
  request: string;

  application: {
    name?: string;
    uri?: string;
    redirectUri: string;
  };

  // account is who would be acting through the application, shown because
  // several accounts can be kept here at once.
  account: {
    name?: string;
    identity?: string;
  };
};

export function AuthorizeForm({request, application, account}: Props) {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(
    answerAuthorization,
    undefined,
  );

  // where the browser goes next is the application's own address, and the
  // backend is the only thing that says what it is: it is one the application
  // registered, whether the answer was yes or no.
  useEffect(() => {
    if (state?.success && state.redirectTo) {
      leaveFor(state.redirectTo);
    }
  }, [state]);

  const name = application.name || t("auth.authorize.unknownApplication");
  const answeredAt = hostOf(application.redirectUri);

  return (
    <Paper withBorder shadow="md" p={30} radius="md">
      <Stack gap="xs" align="center">
        <IconPlugConnected size={36} />
        <Title order={2} ta="center">
          {t("auth.authorize.title", {application: name})}
        </Title>
        {application.uri && (
          <Anchor
            href={application.uri}
            target="_blank"
            rel="noreferrer"
            size="sm"
          >
            {application.uri}
          </Anchor>
        )}
      </Stack>

      <Stack gap="sm" mt="xl">
        <Text>{t("auth.authorize.whatItAsksFor")}</Text>
        <List spacing="xs" size="sm">
          <List.Item>{t("auth.authorize.actsAsYou")}</List.Item>
          <List.Item>{t("auth.authorize.yourPermissions")}</List.Item>
          <List.Item>{t("auth.authorize.untilRevoked")}</List.Item>
        </List>

        {answeredAt && (
          <Text size="sm" c="dimmed">
            {t("auth.authorize.answeredAt", {address: answeredAt})}
          </Text>
        )}

        <Alert
          variant="light"
          color="yellow"
          icon={<IconAlertTriangle />}
          title={t("auth.authorize.warningTitle")}
        >
          {t("auth.authorize.warning")}
        </Alert>

        {(account.name || account.identity) && (
          <Text size="sm" c="dimmed">
            {t("auth.authorize.signedInAs", {
              account: account.name || account.identity || "",
            })}
          </Text>
        )}

        {state?.failed && (
          <Alert
            variant="light"
            color="red"
            title={t("auth.authorize.failedTitle")}
          >
            {t("auth.authorize.failed")}
          </Alert>
        )}

        {state?.success && (
          <Alert variant="light" color="green" icon={<IconCheck />}>
            <Group gap={5}>
              {t("auth.authorize.redirecting")}
              <Loader type="dots" size="sm" />
            </Group>
          </Alert>
        )}

        <Box component="form" action={dispatch}>
          <input type="hidden" name="request" value={request} readOnly />
          <Group grow mt="md">
            <Button
              type="submit"
              name="decision"
              value="deny"
              variant="default"
              disabled={isPending || state?.success}
            >
              {t("auth.authorize.deny")}
            </Button>
            <Button
              type="submit"
              name="decision"
              value="approve"
              loading={isPending}
              disabled={state?.success}
            >
              {t("auth.authorize.approve")}
            </Button>
          </Group>
        </Box>
      </Stack>
    </Paper>
  );
}

// hostOf is where the application will be answered, said the way somebody
// would recognise it. An address that cannot be read is shown as it is rather
// than hidden.
function hostOf(redirectUri: string): string {
  try {
    return new URL(redirectUri).host;
  } catch {
    return redirectUri;
  }
}
