"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  Alert,
  Anchor,
  PasswordInput,
  Paper,
  Title,
  Text,
  Stack,
  Box,
  Button,
} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {resetPassword} from "../actions/reset-password";

type Props = {
  token: string;
};

const RESET_PASSWORD_FIELDS = ["password", "confirm_password", "token"] as const;

export function ResetPasswordForm({token}: Props) {
  const [state, dispatch, isPending] = useActionState(resetPassword, null);

  const formErrors = nonFieldErrors(state?.errors, RESET_PASSWORD_FIELDS);
  const tokenError = state?.errors?.token;
  const fallbackErrors =
    state?.success === false && !state.errors
      ? ["خطایی ناشناخته اتفاق افتاد. لطفا مجددا تلاش نمایید"]
      : [];

  return (
    <Box pt={60}>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title ta="center">تغییر کلمه عبور</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          کلمه عبور جدیدتان را وارد کنید
        </Text>
        <form action={dispatch}>
          <Stack gap={8}>
            <PasswordInput
              label="کلمه عبور جدید"
              placeholder="..."
              name="password"
              mt={"md"}
              error={state?.errors?.password ?? ""}
              disabled={state?.success}
              required
            />
          </Stack>
          <Stack gap={8}>
            <PasswordInput
              label="تکرار کلمه عبور جدید"
              placeholder="..."
              name="confirm_password"
              mt={"sm"}
              error={state?.errors?.confirm_password ?? ""}
              disabled={state?.success}
              required
            />
          </Stack>
          <input name="token" value={token} hidden readOnly />
          {state?.success === true && (
            <Alert
              variant="filled"
              color="green"
              title="ثبت نام موفق"
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              کلمه عبور شما با موفقیت تغییر یافت. میتوانید به صفحه{" "}
              <Anchor
                c={"white"}
                underline="always"
                component={Link}
                href={"/auth/login"}
              >
                ورود
              </Anchor>{" "}
              مراجعه کنید و وارد حساب خود شوید
            </Alert>
          )}
          {state?.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : tokenError
                    ? [tokenError]
                    : fallbackErrors
              }
              title="عملیات ناموفق"
            />
          )}
          <Button
            mt="lg"
            type="submit"
            disabled={state?.success}
            loading={isPending}
            fullWidth
          >
            {state?.success === false ? "تلاش مجدد" : "تغییر کلمه عبور"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
