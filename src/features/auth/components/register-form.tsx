"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  TextInput,
  Anchor,
  Paper,
  Title,
  Text,
  Box,
  Alert,
  Button,
} from "@mantine/core";
import {IconInfoCircle, IconChevronRight} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {registerUser} from "../actions/register-user";

const REGISTER_FIELDS = ["identity"] as const;

export function RegisterForm() {
  const [state, dispatch, isPending] = useActionState(registerUser, {
    success: undefined,
  });

  const fieldErrors = state.success === false ? state.errors : undefined;
  const values = state.success === false ? state.values : undefined;
  const formErrors = nonFieldErrors(fieldErrors, REGISTER_FIELDS);

  return (
    <Box pt={60}>
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
        <Title ta="center">خوش آمدید</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          از قبل حساب دارید؟{" "}
          <Anchor size="sm" component={Link} href={"/auth/login"}>
            وارد شوید
          </Anchor>
        </Text>
        <form action={dispatch}>
          <TextInput
            label="ایمیل"
            placeholder="you@email.com"
            name="identity"
            mt={"md"}
            required
            disabled={state.success}
            defaultValue={values?.identity ?? ""}
            error={fieldErrors?.identity ?? ""}
          />
          {state.success === true && (
            <Alert
              variant="filled"
              color="green"
              title="عملیات موفق"
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              لینک ثبت نام برای شما ارسال شد. لطفا ایمیل خود را بررسی کنید.
            </Alert>
          )}
          {state.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : !state.errors
                    ? ["خطایی ناشناخته اتفاق افتاد لطفا دوباره تلاش نمایید"]
                    : []
              }
              title="عملیات ناموفق"
            />
          )}
          {(state.success === false || state.success === undefined) && (
            <Button mt="lg" type="submit" loading={isPending} fullWidth>
              ثبت نام
            </Button>
          )}
        </form>
      </Paper>
    </Box>
  );
}
