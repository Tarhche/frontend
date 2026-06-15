"use client";

import {useRouter} from "next/navigation";
import {useEffect, useActionState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import Link from "@/components/link";
import {
  Alert,
  Anchor,
  Checkbox,
  Paper,
  Stack,
  TextInput,
  Title,
  PasswordInput,
  Divider,
  Box,
  Loader,
  Group,
  Button,
} from "@mantine/core";
import {IconInfoCircle, IconChevronRight} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {APP_PATHS} from "@/lib/app-paths";
import {useTranslations} from "@/i18n/provider";
import {login} from "../actions/login";

type Props = {
  callbackUrl?: string;
};

const LOGIN_FIELDS = ["identity", "password"] as const;

export function LoginForm({callbackUrl}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, dispatch, isPending] = useActionState(login, null);

  useEffect(() => {
    if (state?.success) {
      if (Boolean(callbackUrl)) {
        router.replace(callbackUrl!);
      } else {
        queryClient.clear();
        router.replace(APP_PATHS.dashboard.index);
      }
    }
  }, [state, queryClient, router, callbackUrl]);

  const formErrors = nonFieldErrors(state?.errors, LOGIN_FIELDS);

  return (
    <Box>
      <Button
        variant="transparent"
        c={"dimmed"}
        component={Link}
        href={"/"}
        leftSection={<IconChevronRight />}
        mb={"sm"}
        p={0}
      >
        {t("auth.shared.home")}
      </Button>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title order={2} ta="center">
          {t("auth.login.title")}
        </Title>
        <Box component="form" mt={"xl"} action={dispatch}>
          <Stack gap={8} mt={"md"}>
            <TextInput
              label={t("auth.shared.identityLabel")}
              placeholder="you@email.com"
              name="identity"
              defaultValue={state?.values?.identity ?? ""}
              disabled={state?.success}
              error={state?.errors?.identity ?? ""}
              required
            />
          </Stack>
          <Stack gap={8} mt={"md"}>
            <PasswordInput
              label={t("auth.login.passwordLabel")}
              placeholder="..."
              name="password"
              disabled={state?.success}
              error={state?.errors?.password ?? ""}
              required
            />
          </Stack>
          <Stack gap={8} mt={"md"}>
            <Checkbox
              name="remember"
              label={t("auth.login.rememberMe")}
              defaultChecked
            />
          </Stack>
          <input
            name="callbackUrl"
            type="text"
            value={callbackUrl}
            readOnly
            hidden
          />
          {state?.success === true && (
            <Alert
              variant="filled"
              color="green"
              title={t("auth.login.successTitle")}
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              <Group gap={5}>
                {t("auth.login.redirecting")}
                <Loader color="white" type="dots" size="sm" />
              </Group>
            </Alert>
          )}
          {state?.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : !state.errors
                    ? [t("auth.login.invalidCredentials")]
                    : []
              }
              title={t("auth.login.failedTitle")}
            />
          )}
          <Button
            mt="md"
            type="submit"
            disabled={state?.success}
            loading={isPending}
            fullWidth
          >
            {state?.success === false ? t("common.tryAgain") : t("nav.login")}
          </Button>
        </Box>
        <Divider my={"md"} />
        <Stack mt={"sm"} gap={"xs"}>
          <Anchor size={"15px"} component={Link} href={"/auth/forgot-password"}>
            {t("auth.login.forgotPassword")}
          </Anchor>
          <Anchor size={"15px"} component={Link} href={"/auth/register"}>
            {t("auth.login.noAccount")}
          </Anchor>
        </Stack>
      </Paper>
    </Box>
  );
}
