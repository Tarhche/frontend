"use client";

import Link from "@/components/link";
import {useEffect, useActionState} from "react";
import {
  Group,
  Stack,
  TextInput,
  Select,
  Anchor,
  Alert,
  Button,
} from "@mantine/core";
import {UserAvatarInput} from "@/components/user-avatar-input";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {APP_PATHS} from "@/lib/app-paths";
import type {Language} from "@/dal/public/languages";
import {notifications} from "@mantine/notifications";
import {updateProfileAction} from "../../actions/update-profile";

type Props = {
  userInfo: {
    name: string;
    email: string;
    username: string;
    avatar: string;
    languageCode: string;
  };
  languages: Language[];
};

const PROFILE_UPDATE_FIELDS = [
  "name",
  "email",
  "username",
  "avatar",
  "language_code",
] as const;

export function ProfileUpdateForm({userInfo, languages}: Props) {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(updateProfileAction, {
    success: null,
  });
  const {username, name, avatar, email, languageCode} = userInfo;

  useEffect(() => {
    if (state.success) {
      notifications.show({
        title: t("profile.update.notification.title"),
        message: t("profile.update.notification.message"),
        color: "green",
      });
      // Language changed: hard reload so the whole app re-resolves the new
      // language (token for the dashboard, cookie for public) and flips
      // direction from a clean server render.
      if (state.languageChanged) {
        window.location.reload();
      }
    }
  }, [state, state.success, state.languageChanged, t]);

  const formErrors = nonFieldErrors(state.errors, PROFILE_UPDATE_FIELDS);

  return (
    <form action={dispatch}>
      <ServerComponentErrorHandler state={state} />
      <Group align="flex-start" justify="center">
        <UserAvatarInput userId={email} defaultValue={avatar} />
        <Stack flex={"1 1 300px"}>
          <TextInput
            type="text"
            name="name"
            defaultValue={state.values?.name ?? name}
            error={state.errors?.name ?? ""}
          />
          <TextInput
            type="email"
            name="email"
            defaultValue={state.values?.email ?? email}
            error={state.errors?.email ?? ""}
          />
          <TextInput
            name="username"
            type="text"
            defaultValue={state.values?.username ?? username}
            error={state.errors?.username ?? ""}
          />
          <Select
            name="language_code"
            label={t("profile.update.languageLabel")}
            data={languages.map((language) => ({
              value: language.code,
              label: language.name,
            }))}
            defaultValue={state.values?.language_code ?? languageCode}
            error={state.errors?.language_code ?? ""}
            allowDeselect={false}
          />
          <ValidationErrorsAlert errors={formErrors} />
          <Alert>
            {t("profile.update.changePasswordPrefix")}{" "}
            <Anchor
              component={Link}
              href={APP_PATHS.dashboard.profile.editPassword}
            >
              {t("profile.update.changePasswordLink")}
            </Anchor>{" "}
            {t("profile.update.changePasswordSuffix")}
          </Alert>
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={isPending}>
              {t("profile.update.submit")}
            </Button>
          </Group>
        </Stack>
      </Group>
    </form>
  );
}
