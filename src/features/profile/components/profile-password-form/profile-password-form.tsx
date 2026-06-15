"use client";

import {useActionState} from "react";
import {Stack, Group, TextInput, Button} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {updateProfilePasswordAction} from "../../actions/update-password";

const PROFILE_PASSWORD_FIELDS = ["current_password", "new_password"] as const;

export function ProfilePasswordForm() {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(
    updateProfilePasswordAction,
    {
      success: true,
    },
  );

  const formErrors = nonFieldErrors(state.errors, PROFILE_PASSWORD_FIELDS);

  return (
    <form action={dispatch}>
      <ServerComponentErrorHandler state={state} />
      <Stack>
        <TextInput
          name="current_password"
          label={t("profile.password.currentPasswordLabel")}
          error={state.errors?.current_password ?? ""}
        />
        <TextInput
          name="new_password"
          label={t("profile.password.newPasswordLabel")}
          error={state.errors?.new_password ?? ""}
        />
        <ValidationErrorsAlert errors={formErrors} />
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isPending}>
            {t("profile.password.submit")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
