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
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
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

const ROLE_UPSERT_FIELDS = [
  "name",
  "description",
  "permissions",
  "user_uuids",
  "uuid",
] as const;

export function FormFields({defaultValues, children}: Partial<Props>) {
  const isUpdating = defaultValues?.roleId !== undefined;
  const [state, dispatch, isPending] = useActionState(upsertRoleAction, {
    success: true,
  });

  const formErrors = nonFieldErrors(state.errors, ROLE_UPSERT_FIELDS);

  return (
    <form action={dispatch}>
      <ServerComponentErrorHandler state={state} />
      <Fieldset>
        <Stack>
          <TextInput
            name="name"
            label="نام نقش"
            defaultValue={
              state.values?.name ?? defaultValues?.defaultRoleName ?? ""
            }
            error={state.errors?.name ?? ""}
          />
          <TextInput
            name="description"
            label="توضیحات نقش"
            defaultValue={
              state.values?.description ??
              defaultValues?.defaultRoleDescription ??
              ""
            }
            error={state.errors?.description ?? ""}
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
            defaultValue={
              state.values?.user_uuids ?? defaultValues?.defaultUsers
            }
            error={state.errors?.user_uuids ?? ""}
          />
        </Stack>
        <ValidationErrorsAlert errors={formErrors} />
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
