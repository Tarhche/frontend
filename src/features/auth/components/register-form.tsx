"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  TextInput,
  Anchor,
  Paper,
  Title,
  Text,
  Box,
  Alert,
  Button,
} from "@mantine/core";
import {IconInfoCircle, IconChevronRight} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {registerUser} from "../actions/register-user";

const REGISTER_FIELDS = ["identity"] as const;

export function RegisterForm() {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(registerUser, {
    success: undefined,
  });

  const fieldErrors = state.success === false ? state.errors : undefined;
  const values = state.success === false ? state.values : undefined;
  const formErrors = nonFieldErrors(fieldErrors, REGISTER_FIELDS);

  return (
    <Box pt={60}>
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
        <Title ta="center">{t("auth.register.welcome")}</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          {t("auth.register.alreadyHaveAccount")}{" "}
          <Anchor size="sm" component={Link} href={"/auth/login"}>
            {t("auth.register.signIn")}
          </Anchor>
        </Text>
        <form action={dispatch}>
          <TextInput
            label={t("auth.register.emailLabel")}
            placeholder="you@email.com"
            name="identity"
            mt={"md"}
            required
            disabled={state.success}
            defaultValue={values?.identity ?? ""}
            error={fieldErrors?.identity ?? ""}
          />
          {state.success === true && (
            <Alert
              variant="filled"
              color="green"
              title={t("auth.register.successTitle")}
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              {t("auth.register.successMessage")}
            </Alert>
          )}
          {state.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : !state.errors
                    ? [t("auth.register.unknownError")]
                    : []
              }
              title={t("auth.shared.operationFailed")}
            />
          )}
          {(state.success === false || state.success === undefined) && (
            <Button mt="lg" type="submit" loading={isPending} fullWidth>
              {t("auth.register.submit")}
            </Button>
          )}
        </form>
      </Paper>
    </Box>
  );
}
