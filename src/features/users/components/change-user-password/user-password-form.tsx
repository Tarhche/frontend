"use client";

import {useActionState} from "react";
import {Paper, Stack, Group, TextInput, Button} from "@mantine/core";
import {updateUserPasswordAction} from "../../actions/change-password";

type Props = {
  userId: string;
};

export function UserPasswordForm({userId}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateUserPasswordAction,
    {
      success: true,
    },
  );

  return (
    <Paper withBorder p="xl">
      <form action={formAction}>
        <Stack>
          <TextInput
            label="کلمه عبور"
            name="password"
            error={state.fieldErrors?.password}
          />
          <TextInput
            label="تکرار کلمه عبور"
            name="repassword"
            error={state.fieldErrors?.rePassword}
          />
          <Group justify="flex-end" mt={"lg"}>
            <Button type="submit" loading={isPending}>
              تغییر کلمه عبور
            </Button>
          </Group>
          <input type="text" name="userId" value={userId} readOnly hidden />
        </Stack>
      </form>
    </Paper>
  );
}
