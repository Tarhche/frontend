"use client";

import {useActionState} from "react";
import {Group, Stack, Textarea, Button} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {updateSettingAction} from "../actions/update-setting";

type Props = {
  config: {
    userDefaultRoles: string[];
  };
};

const APP_SETTING_FIELDS = ["user_default_roles"] as const;

export function AppSettingForm({config}: Props) {
  const [state, dispatch, isPending] = useActionState(updateSettingAction, {
    success: false,
  });

  const formErrors = nonFieldErrors(state.errors, APP_SETTING_FIELDS);

  return (
    <form action={dispatch}>
      <ServerComponentErrorHandler state={state} />
      <Stack>
        <Textarea
          name="user_default_roles"
          label="نقش پیشفرض کاربران"
          rows={4}
          defaultValue={state.values?.user_default_roles ?? config.userDefaultRoles}
          dir="ltr"
          styles={{
            input: {
              textAlign: "left",
            },
          }}
          error={state.errors?.user_default_roles ?? ""}
        />
        <ValidationErrorsAlert errors={formErrors} />
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isPending}>
            بروزرسانی
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
