"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  Paper,
  Stack,
  Group,
  TextInput,
  Select,
  Alert,
  Anchor,
  Button,
} from "@mantine/core";
import {UserAvatarInput} from "@/components/user-avatar-input";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import type {Language} from "@/dal/public/languages";
import {upsertUserAction} from "../../actions/upsert-user";
import {APP_PATHS} from "@/lib/app-paths";

type Props = {
  userInfo?: Partial<{
    userId: string;
    defaultAvatar: string;
    defaultName: string;
    defaultUsername: string;
    defaultEmail: string;
    defaultLanguageCode: string;
  }>;
  languages?: Language[];
};

const USER_UPSERT_FIELDS = [
  "name",
  "email",
  "username",
  "password",
  "avatar",
  "language_code",
  "uuid",
] as const;

export function UpsertUserForm({userInfo = {}, languages = []}: Props) {
  const t = useTranslations();
  const {
    userId,
    defaultUsername,
    defaultAvatar,
    defaultEmail,
    defaultName,
    defaultLanguageCode,
  } = userInfo;
  const [state, dispatch, isPending] = useActionState(upsertUserAction, {
    success: true,
  });

  const formErrors = nonFieldErrors(state.errors, USER_UPSERT_FIELDS);

  return (
    <Paper p={"xl"} withBorder>
      <form action={dispatch}>
        <ServerComponentErrorHandler state={state} />
        <Group justify="center" align="flex-start" gap={"xl"}>
          <UserAvatarInput defaultValue={defaultAvatar} userId={userId} />
          <Stack gap={"sm"} flex={1}>
            <TextInput
              name="name"
              label={t("users.form.name")}
              error={state.errors?.name ?? ""}
              defaultValue={state.values?.name ?? defaultName ?? ""}
            />
            <TextInput
              type="email"
              name="email"
              label={t("users.form.email")}
              error={state.errors?.email ?? ""}
              defaultValue={state.values?.email ?? defaultEmail ?? ""}
            />
            <TextInput
              name="username"
              label={t("users.form.username")}
              error={state.errors?.username ?? ""}
              defaultValue={state.values?.username ?? defaultUsername ?? ""}
            />
            <Select
              name="language_code"
              label={t("users.form.language")}
              data={languages.map((language) => ({
                value: language.code,
                label: language.name,
              }))}
              defaultValue={
                state.values?.language_code ?? defaultLanguageCode ?? ""
              }
              error={state.errors?.language_code ?? ""}
              allowDeselect={false}
            />
            {userId === undefined && (
              <TextInput
                name="password"
                label={t("users.form.password")}
                error={state.errors?.password ?? ""}
              />
            )}
            <ValidationErrorsAlert errors={formErrors} />
            {userId !== undefined && (
              <Alert mt={"xs"}>
                {t("users.form.changePasswordPrefix")}{" "}
                <Anchor
                  component={Link}
                  href={APP_PATHS.dashboard.users.editPassword(userId)}
                >
                  {t("users.form.changePasswordLink")}
                </Anchor>{" "}
                {t("users.form.changePasswordSuffix")}
              </Alert>
            )}
            <input name="uuid" value={userId} readOnly hidden />
            <Group justify="flex-end" mt={userId ? "xs" : "lg"}>
              <Button type="submit" loading={isPending}>
                {userId === undefined
                  ? t("users.form.save")
                  : t("users.form.update")}
              </Button>
            </Group>
          </Stack>
        </Group>
      </form>
    </Paper>
  );
}
