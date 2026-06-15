"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  Alert,
  Box,
  Button,
} from "@mantine/core";
import {IconInfoCircle, IconChevronRight} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {forgotPassword} from "../actions/forgot-password";

const FORGOT_PASSWORD_FIELDS = ["identity"] as const;

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(
    forgotPassword,
    undefined,
  );

  const formErrors = nonFieldErrors(state?.errors, FORGOT_PASSWORD_FIELDS);
  const fallbackErrors =
    state?.success === false && !state.errors
      ? [t("auth.forgotPassword.unknownError")]
      : [];

  return (
    <Box pt={50}>
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
        <Title ta="center">{t("auth.forgotPassword.title")}</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          {t("auth.forgotPassword.description")}
        </Text>
        <form action={dispatch}>
          <Stack gap={8}>
            <TextInput
              label={t("auth.shared.identityLabel")}
              placeholder="you@email.com"
              name="identity"
              mt={"md"}
              defaultValue={state?.values?.identity ?? ""}
              error={state?.errors?.identity ?? ""}
              disabled={state?.success}
              required
            />
          </Stack>
          {state?.success === true && (
            <Alert
              variant="filled"
              color="green"
              title={t("auth.forgotPassword.successTitle")}
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              {t("auth.forgotPassword.successMessage")}
            </Alert>
          )}
          {state?.success === false && (
            <ValidationErrorsAlert
              errors={formErrors.length > 0 ? formErrors : fallbackErrors}
              title={t("auth.shared.operationFailed")}
            />
          )}
          <Button
            mt="sm"
            type="submit"
            disabled={state?.success}
            loading={isPending}
            fullWidth
          >
            {t("auth.forgotPassword.requestPrefix")}{" "}
            {state?.success === false
              ? t("auth.forgotPassword.requestRetry")
              : t("auth.forgotPassword.requestReset")}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
