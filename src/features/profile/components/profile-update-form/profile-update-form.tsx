"use client";

import Link from "@/components/link";
import {useEffect, useActionState} from "react";
import {Group, Stack, TextInput, Anchor, Alert, Button} from "@mantine/core";
import {UserAvatarInput} from "@/components/user-avatar-input";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {APP_PATHS} from "@/lib/app-paths";
import {notifications} from "@mantine/notifications";
import {updateProfileAction} from "../../actions/update-profile";

type Props = {
  userInfo: {
    name: string;
    email: string;
    username: string;
    avatar: string;
  };
};

const PROFILE_UPDATE_FIELDS = ["name", "email", "username", "avatar"] as const;

export function ProfileUpdateForm({userInfo}: Props) {
  const [state, dispatch, isPending] = useActionState(updateProfileAction, {
    success: null,
  });
  const {username, name, avatar, email} = userInfo;

  useEffect(() => {
    if (state.success) {
      notifications.show({
        title: "بروزرسانی موفق",
        message: "پروفایل با موفقیت بروز شد",
        color: "green",
      });
    }
  }, [state, state.success]);

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
          <ValidationErrorsAlert errors={formErrors} />
          <Alert>
            برای تغییر کلمه عبور از{" "}
            <Anchor
              component={Link}
              href={APP_PATHS.dashboard.profile.editPassword}
            >
              اینجا
            </Anchor>{" "}
            اقدام کنید
          </Alert>
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={isPending}>
              ویرایش پروفایل
            </Button>
          </Group>
        </Stack>
      </Group>
    </form>
  );
}
