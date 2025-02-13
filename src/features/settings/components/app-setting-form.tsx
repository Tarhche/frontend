"use client";
import {useActionState} from "react";
import {Group, Stack, Textarea, Button} from "@mantine/core";
import {updateSettingAction} from "../actions/update-setting";

type Props = {
  config: {
    userDefaultRoles: string[];
  };
};

export function AppSettingForm({config}: Props) {
  const [state, dispatch, isPending] = useActionState(updateSettingAction, {
    success: false,
  });

  return (
    <form action={dispatch}>
      <Stack>
        <Textarea
          name="user_default_roles"
          label="نقش پیشفرض کاربران"
          rows={4}
          defaultValue={config.userDefaultRoles}
          dir="ltr"
          styles={{
            input: {
              textAlign: "left",
            },
          }}
          error={state.fieldErrors?.user_default_roles || ""}
        />
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isPending}>
            بروزرسانی
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
