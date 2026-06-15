"use client";

import {useActionState} from "react";
import {Group, Stack, Textarea, Select, Button} from "@mantine/core";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import type {Language} from "@/dal/public/languages";
import {updateSettingAction} from "../actions/update-setting";

type Props = {
  config: {
    userDefaultRoles: string[];
    defaultLanguageCode: string;
  };
  languages: Language[];
};

const APP_SETTING_FIELDS = [
  "user_default_roles",
  "default_language_code",
] as const;

export function AppSettingForm({config, languages}: Props) {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(
    updateSettingAction,
    null,
  );

  const formErrors = nonFieldErrors(state?.errors, APP_SETTING_FIELDS);

  return (
    <form action={dispatch}>
      <ServerComponentErrorHandler state={state} />
      <Stack>
        <Textarea
          name="user_default_roles"
          label={t("settings.form.userDefaultRolesLabel")}
          rows={4}
          defaultValue={
            state?.values?.user_default_roles ?? config.userDefaultRoles
          }
          dir="ltr"
          styles={{
            input: {
              textAlign: "left",
            },
          }}
          error={state?.errors?.user_default_roles ?? ""}
        />
        <Select
          name="default_language_code"
          label={t("settings.form.defaultLanguageLabel")}
          data={languages.map((language) => ({
            value: language.code,
            label: language.name,
          }))}
          defaultValue={
            state?.values?.default_language_code ?? config.defaultLanguageCode
          }
          error={state?.errors?.default_language_code ?? ""}
          allowDeselect={false}
        />
        <ValidationErrorsAlert errors={formErrors} />
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={isPending}>
            {t("settings.form.submit")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
