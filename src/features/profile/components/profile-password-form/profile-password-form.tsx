"use client";

import {useActionState} from "react";
import {Stack, Group, TextInput, Button} from "@mantine/core";
import {updateProfilePasswordAction} from "../../actions/update-password";

export function ProfilePasswordForm() {
  const [state, dispatch, isPending] = useActionState(
    updateProfilePasswordAction,
    {
      success: true,
    },
  );

  return (
    <form action={dispatch}>
      <Stack>
        <TextInput
          name="current_password"
          label="کلمه عبور کنونی"
          error={state.fieldErrors?.current_password || ""}
        />
        <TextInput
          name="new_password"
          label="کلمه عبور جدید"
          error={state.fieldErrors?.new_password || ""}
        />
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isPending}>
            تغییر کلمه عبور
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
