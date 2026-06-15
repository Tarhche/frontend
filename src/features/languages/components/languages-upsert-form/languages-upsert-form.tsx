"use client";

import {useActionState} from "react";
import {Stack, TextInput, Fieldset, Group, Button} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {upsertLanguageAction} from "../../actions/upsert-language";

export type DefaultValues = {
  code: string;
  name: string;
};

type Props = {
  defaultValues?: DefaultValues;
};

const LANGUAGE_UPSERT_FIELDS = ["code", "name"] as const;

export function LanguagesUpsertForm({defaultValues}: Props) {
  const t = useTranslations();
  const isUpdating = defaultValues !== undefined;
  const [state, dispatch, isPending] = useActionState(upsertLanguageAction, {
    success: true,
  });

  const formErrors = nonFieldErrors(state.errors, LANGUAGE_UPSERT_FIELDS);

  return (
    <form action={dispatch}>
      <ServerComponentErrorHandler state={state} />
      <Fieldset>
        <Stack>
          <TextInput
            name="code"
            label={t("languages.form.codeLabel")}
            placeholder="EN"
            description={t("languages.form.codeDescription")}
            defaultValue={state.values?.code ?? defaultValues?.code ?? ""}
            error={state.errors?.code ?? ""}
            readOnly={isUpdating}
            required
          />
          <TextInput
            name="name"
            label={t("languages.form.nameLabel")}
            placeholder="English"
            defaultValue={state.values?.name ?? defaultValues?.name ?? ""}
            error={state.errors?.name ?? ""}
            required
          />
        </Stack>
        <ValidationErrorsAlert errors={formErrors} />
        {isUpdating && <input name="isUpdating" value="true" hidden readOnly />}
        <Group justify="flex-end" mt="xl">
          <Button type="submit" loading={isPending}>
            {isUpdating
              ? t("languages.form.update")
              : t("languages.form.create")}
          </Button>
        </Group>
      </Fieldset>
    </form>
  );
}
