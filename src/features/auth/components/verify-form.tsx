"use client";

import {useActionState} from "react";
import Link from "@/components/link";
import {
  TextInput,
  PasswordInput,
  Select,
  Text,
  Paper,
  Group,
  Container,
  Stack,
  Alert,
  Anchor,
  Button,
} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import type {Language} from "@/dal/public/languages";
import {verifyUser} from "../actions/verify-user";

type Props = {
  token: string;
  languages: Language[];
  defaultCode: string;
};

const VERIFY_FIELDS = [
  "name",
  "username",
  "language_code",
  "password",
  "repassword",
] as const;

export function VerifyForm({token, languages, defaultCode}: Props) {
  const [state, dispatch, isPending] = useActionState(verifyUser, {
    success: false,
  });
  const fieldErrors = state.errors;
  const formErrors = nonFieldErrors(fieldErrors, VERIFY_FIELDS);
  const fallbackErrors =
    state.success === false && !state.errors
      ? ["عملیات با خطا مواجه شد لطفا دوباره تلاش نمایید"]
      : [];

  if (state.success) {
    return (
      <Container size={500} p={0} mt={"xl"}>
        <Paper radius={"md"} p={"xl"} withBorder>
          <Alert
            variant="filled"
            color="green"
            title="ثبت نام موفق"
            mt={"sm"}
            icon={<IconInfoCircle />}
          >
            حساب شما با موفقیت تایید شد، لطفا به صفحه{" "}
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
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={500} p={0} mt={"xl"}>
      <Paper radius="md" p="xl" withBorder>
        <Text size="lg" mb={"lg"} fw={500}>
          جهت تکمیل ثبت نام اطلاعات زیر را وارد کنید
        </Text>
        <form action={dispatch}>
          <Stack>
            <Stack gap={8}>
              <TextInput
                name="name"
                label="نام"
                radius="md"
                defaultValue={state.values?.name ?? ""}
                error={fieldErrors?.name ?? ""}
                required
              />
            </Stack>
            <Stack gap={8}>
              <TextInput
                name="username"
                label="نام کاربری (یوزرنیم)"
                radius="md"
                defaultValue={state.values?.username ?? ""}
                error={fieldErrors?.username ?? ""}
                required
              />
            </Stack>
            <Stack gap={8}>
              <Select
                name="language_code"
                label="زبان"
                radius="md"
                data={languages.map((language) => ({
                  value: language.code,
                  label: language.name,
                }))}
                defaultValue={state.values?.language_code ?? defaultCode}
                error={fieldErrors?.language_code ?? ""}
                allowDeselect={false}
                required
              />
            </Stack>
            <Stack gap={8}>
              <PasswordInput
                name="password"
                label="کلمه عبور"
                radius="md"
                error={fieldErrors?.password ?? ""}
                required
              />
            </Stack>
            <Stack gap={8}>
              <PasswordInput
                name="repassword"
                label="تکرار کلمه عبور"
                radius="md"
                error={fieldErrors?.repassword ?? ""}
                required
              />
            </Stack>
            <input name="token" value={token} hidden readOnly />
          </Stack>
          <ValidationErrorsAlert
            errors={formErrors.length > 0 ? formErrors : fallbackErrors}
            title="ثبت نام ناموفق"
          />
          <Group
            justify="space-between"
            mt={formErrors.length > 0 || fallbackErrors.length > 0 ? "sm" : "xl"}
          >
            <Button type="submit" loading={isPending} fullWidth>
              تکمیل ثبت نام
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}
