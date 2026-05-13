"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  TextInput,
  Paper,
  Title,
  Text,
  Stack,
  Alert,
  Box,
  Button,
} from "@mantine/core";
import {IconInfoCircle, IconChevronRight} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {forgotPassword} from "../actions/forgot-password";

const FORGOT_PASSWORD_FIELDS = ["identity"] as const;

export function ForgotPasswordForm() {
  const [state, dispatch, isPending] = useActionState(
    forgotPassword,
    undefined,
  );

  const formErrors = nonFieldErrors(state?.errors, FORGOT_PASSWORD_FIELDS);
  const fallbackErrors =
    state?.success === false && !state.errors
      ? ["خطایی ناشناخته رخ داد لطفا مجددا تلاش نمایید"]
      : [];

  return (
    <Box pt={50}>
      <Button
        variant="transparent"
        c={"dimmed"}
        component={Link}
        href={"/"}
        leftSection={<IconChevronRight />}
        mb={"sm"}
        p={0}
      >
        صفحه اصلی
      </Button>
      <Paper withBorder shadow="md" p={30} radius="md">
        <Title ta="center">بازیابی کلمه عبور</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          با ایمیل یا نام کاربری تان میتوانید کلمه عبورتان را تغییر دهید
        </Text>
        <form action={dispatch}>
          <Stack gap={8}>
            <TextInput
              label="ایمیل یا نام کاربری"
              placeholder="you@email.com"
              name="identity"
              mt={"md"}
              defaultValue={state?.values?.identity ?? ""}
              error={state?.errors?.identity ?? ""}
              disabled={state?.success}
              required
            />
          </Stack>
          {state?.success === true && (
            <Alert
              variant="filled"
              color="green"
              title="عملیات موفق"
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              لینک بازیابی کلمه عبور با موفقیت برای شما ارسال شد. لطفا ایمیل خود
              را بررسی کنید
            </Alert>
          )}
          {state?.success === false && (
            <ValidationErrorsAlert
              errors={formErrors.length > 0 ? formErrors : fallbackErrors}
              title="عملیات ناموفق"
            />
          )}
          <Button
            mt="sm"
            type="submit"
            disabled={state?.success}
            loading={isPending}
            fullWidth
          >
            درخواست {state?.success === false ? "مجدد" : "بازیابی"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
