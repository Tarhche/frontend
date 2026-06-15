"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  Alert,
  Anchor,
  PasswordInput,
  Paper,
  Title,
  Text,
  Stack,
  Box,
  Button,
} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {resetPassword} from "../actions/reset-password";

type Props = {
  token: string;
};

const RESET_PASSWORD_FIELDS = [
  "password",
  "confirm_password",
  "token",
] as const;

export function ResetPasswordForm({token}: Props) {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(resetPassword, null);

  const formErrors = nonFieldErrors(state?.errors, RESET_PASSWORD_FIELDS);
  const tokenError = state?.errors?.token;
  const fallbackErrors =
    state?.success === false && !state.errors
      ? [t("auth.resetPassword.unknownError")]
      : [];

  return (
    <Box pt={60}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title ta="center">{t("auth.resetPassword.title")}</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          {t("auth.resetPassword.description")}
        </Text>
        <form action={dispatch}>
          <Stack gap={8}>
            <PasswordInput
              label={t("auth.resetPassword.newPasswordLabel")}
              placeholder="..."
              name="password"
              mt={"md"}
              error={state?.errors?.password ?? ""}
              disabled={state?.success}
              required
            />
          </Stack>
          <Stack gap={8}>
            <PasswordInput
              label={t("auth.resetPassword.confirmNewPasswordLabel")}
              placeholder="..."
              name="confirm_password"
              mt={"sm"}
              error={state?.errors?.confirm_password ?? ""}
              disabled={state?.success}
              required
            />
          </Stack>
          <input name="token" value={token} hidden readOnly />
          {state?.success === true && (
            <Alert
              variant="filled"
              color="green"
              title={t("auth.resetPassword.successTitle")}
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              {t("auth.resetPassword.successMessagePrefix")}{" "}
              <Anchor
                c={"white"}
                underline="always"
                component={Link}
                href={"/auth/login"}
              >
                {t("auth.resetPassword.successMessageLoginLink")}
              </Anchor>{" "}
              {t("auth.resetPassword.successMessageSuffix")}
            </Alert>
          )}
          {state?.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : tokenError
                    ? [tokenError]
                    : fallbackErrors
              }
              title={t("auth.shared.operationFailed")}
            />
          )}
          <Button
            mt="lg"
            type="submit"
            disabled={state?.success}
            loading={isPending}
            fullWidth
          >
            {state?.success === false
              ? t("common.tryAgain")
              : t("auth.resetPassword.submit")}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
