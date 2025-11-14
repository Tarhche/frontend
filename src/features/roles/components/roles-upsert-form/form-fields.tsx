"use client";

import {useActionState} from "react";
import {
  Stack,
  TextInput,
  Textarea,
  Fieldset,
  Group,
  Button,
} from "@mantine/core";
import {upsertRoleAction} from "../../actions/upsert-role";

export type DefaultValues = {
  roleId: string;
  defaultRoleName: string;
  defaultRoleDescription: string;
  defaultUsers: string[];
};

type Props = {
  defaultValues?: DefaultValues;
  children: React.ReactNode;
};

export function FormFields({defaultValues, children}: Partial<Props>) {
  const isUpdating = defaultValues?.roleId !== undefined;
  const [state, dispatch, isPending] = useActionState(upsertRoleAction, {
    success: true,
  });

  return (
    <form action={dispatch}>
      <Fieldset>
        <Stack>
          <TextInput
            name="name"
            label="نام نقش"
            defaultValue={defaultValues?.defaultRoleName || ""}
            error={state.fieldErrors?.name}
          />
          <TextInput
            name="description"
            label="توضیحات نقش"
            defaultValue={defaultValues?.defaultRoleDescription || ""}
            error={state.fieldErrors?.description}
          />
          <Fieldset my={"md"}>{children}</Fieldset>
          <Textarea
            name="user_uuids"
            label="کاربر ها"
            rows={5}
            styles={{
              input: {
                direction: "ltr",
                textAlign: "left",
              },
            }}
            defaultValue={defaultValues?.defaultUsers}
          />
        </Stack>
        {isUpdating && (
          <input name="roleId" value={defaultValues?.roleId} hidden readOnly />
        )}
        <Group justify="flex-end" mt="xl">
          <Button type="submit" loading={isPending}>
            {isUpdating ? "بروزرسانی نقش" : "ایجاد نقش"}
          </Button>
        </Group>
      </Fieldset>
    </form>
  );
}
