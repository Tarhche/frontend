"use client";

import {useRouter} from "next/navigation";
import {useEffect, useActionState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import Link from "@/components/link";
import {
  Alert,
  Anchor,
  Checkbox,
  Paper,
  Stack,
  TextInput,
  Title,
  PasswordInput,
  Divider,
  Box,
  Loader,
  Group,
  Button,
} from "@mantine/core";
import {IconInfoCircle, IconChevronRight} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {APP_PATHS} from "@/lib/app-paths";
import {login} from "../actions/login";

type Props = {
  callbackUrl?: string;
};

const LOGIN_FIELDS = ["identity", "password"] as const;

export function LoginForm({callbackUrl}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, dispatch, isPending] = useActionState(login, null);

  useEffect(() => {
    if (state?.success) {
      if (Boolean(callbackUrl)) {
        router.replace(callbackUrl!);
      } else {
        queryClient.clear();
        router.replace(APP_PATHS.dashboard.index);
      }
    }
  }, [state, queryClient, router, callbackUrl]);

  const formErrors = nonFieldErrors(state?.errors, LOGIN_FIELDS);

  return (
    <Box>
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
        <Title order={2} ta="center">
          ورود به پنل کاربری
        </Title>
        <Box component="form" mt={"xl"} action={dispatch}>
          <Stack gap={8} mt={"md"}>
            <TextInput
              label="ایمیل یا نام کاربری"
              placeholder="you@email.com"
              name="identity"
              defaultValue={state?.values?.identity ?? ""}
              disabled={state?.success}
              error={state?.errors?.identity ?? ""}
              required
            />
          </Stack>
          <Stack gap={8} mt={"md"}>
            <PasswordInput
              label="کلمه عبور"
              placeholder="..."
              name="password"
              disabled={state?.success}
              error={state?.errors?.password ?? ""}
              required
            />
          </Stack>
          <Stack gap={8} mt={"md"}>
            <Checkbox
              name="remember"
              label="من را به خاطر بسپار"
              defaultChecked
            />
          </Stack>
          <input
            name="callbackUrl"
            type="text"
            value={callbackUrl}
            readOnly
            hidden
          />
          {state?.success === true && (
            <Alert
              variant="filled"
              color="green"
              title="با موفقیت وارد شدید"
              mt={"sm"}
              icon={<IconInfoCircle />}
            >
              <Group gap={5}>
                در حال منتقل شدن هستید
                <Loader color="white" type="dots" size="sm" />
              </Group>
            </Alert>
          )}
          {state?.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : !state.errors
                    ? [
                        " ایمیل یا نام کاربری یا کلمه عبورتان را اشتباه وارد کرده اید",
                      ]
                    : []
              }
              title="ورود ناموفق"
            />
          )}
          <Button
            mt="md"
            type="submit"
            disabled={state?.success}
            loading={isPending}
            fullWidth
          >
            {state?.success === false ? "تلاش مجدد" : "ورود"}
          </Button>
        </Box>
        <Divider my={"md"} />
        <Stack mt={"sm"} gap={"xs"}>
          <Anchor size={"15px"} component={Link} href={"/auth/forgot-password"}>
            کلمه عبورتان را فراموش کرده اید؟
          </Anchor>
          <Anchor size={"15px"} component={Link} href={"/auth/register"}>
            حسابی ندارید؟ یکی بسازید
          </Anchor>
        </Stack>
      </Paper>
    </Box>
  );
}
