"use client";

import {useActionState} from "react";
import {Paper, Stack, Group, TextInput, Button} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {updateUserPasswordAction} from "../../actions/change-password";

type Props = {
  userId: string;
};

const USER_PASSWORD_FIELDS = ["new_password", "repassword", "userId"] as const;

export function UserPasswordForm({userId}: Props) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(
    updateUserPasswordAction,
    {
      success: true,
    },
  );

  const formErrors = nonFieldErrors(state.errors, USER_PASSWORD_FIELDS);

  return (
    <Paper withBorder p="xl">
      <form action={formAction}>
        <ServerComponentErrorHandler state={state} />
        <Stack>
          <TextInput
            label={t("users.password.newPassword")}
            name="new_password"
            error={state.errors?.new_password ?? ""}
          />
          <TextInput
            label={t("users.password.repeatPassword")}
            name="repassword"
            error={state.errors?.repassword ?? ""}
          />
          <ValidationErrorsAlert errors={formErrors} />
          <Group justify="flex-end" mt={"lg"}>
            <Button type="submit" loading={isPending}>
              {t("users.password.submit")}
            </Button>
          </Group>
          <input type="text" name="userId" value={userId} readOnly hidden />
        </Stack>
      </form>
    </Paper>
  );
}
