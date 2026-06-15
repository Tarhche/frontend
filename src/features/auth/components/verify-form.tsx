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
import {useTranslations} from "@/i18n/provider";
import {verifyUser} from "../actions/verify-user";

type Props = {
  token: string;
  languages: Language[];
  defaultLanguageCode: string;
};

const VERIFY_FIELDS = [
  "name",
  "username",
  "language_code",
  "password",
  "repassword",
] as const;

export function VerifyForm({token, languages, defaultLanguageCode}: Props) {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(verifyUser, {
    success: false,
  });
  const fieldErrors = state.errors;
  const formErrors = nonFieldErrors(fieldErrors, VERIFY_FIELDS);
  const fallbackErrors =
    state.success === false && !state.errors
      ? [t("auth.verify.unknownError")]
      : [];

  if (state.success) {
    return (
      <Container size={500} p={0} mt={"xl"}>
        <Paper radius={"md"} p={"xl"} withBorder>
          <Alert
            variant="filled"
            color="green"
            title={t("auth.verify.successTitle")}
            mt={"sm"}
            icon={<IconInfoCircle />}
          >
            {t("auth.verify.successMessagePrefix")}{" "}
            <Anchor
              c={"white"}
              underline="always"
              component={Link}
              href={"/auth/login"}
            >
              {t("auth.verify.successMessageLoginLink")}
            </Anchor>{" "}
            {t("auth.verify.successMessageSuffix")}
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={500} p={0} mt={"xl"}>
      <Paper radius="md" p="xl" withBorder>
        <Text size="lg" mb={"lg"} fw={500}>
          {t("auth.verify.heading")}
        </Text>
        <form action={dispatch}>
          <Stack>
            <Stack gap={8}>
              <TextInput
                name="name"
                label={t("auth.verify.nameLabel")}
                radius="md"
                defaultValue={state.values?.name ?? ""}
                error={fieldErrors?.name ?? ""}
                required
              />
            </Stack>
            <Stack gap={8}>
              <TextInput
                name="username"
                label={t("auth.verify.usernameLabel")}
                radius="md"
                defaultValue={state.values?.username ?? ""}
                error={fieldErrors?.username ?? ""}
                required
              />
            </Stack>
            <Stack gap={8}>
              <Select
                name="language_code"
                label={t("auth.verify.languageLabel")}
                radius="md"
                data={languages.map((language) => ({
                  value: language.code,
                  label: language.name,
                }))}
                defaultValue={
                  state.values?.language_code ?? defaultLanguageCode
                }
                error={fieldErrors?.language_code ?? ""}
                allowDeselect={false}
                required
              />
            </Stack>
            <Stack gap={8}>
              <PasswordInput
                name="password"
                label={t("auth.verify.passwordLabel")}
                radius="md"
                error={fieldErrors?.password ?? ""}
                required
              />
            </Stack>
            <Stack gap={8}>
              <PasswordInput
                name="repassword"
                label={t("auth.verify.confirmPasswordLabel")}
                radius="md"
                error={fieldErrors?.repassword ?? ""}
                required
              />
            </Stack>
            <input name="token" value={token} hidden readOnly />
          </Stack>
          <ValidationErrorsAlert
            errors={formErrors.length > 0 ? formErrors : fallbackErrors}
            title={t("auth.verify.failedTitle")}
          />
          <Group
            justify="space-between"
            mt={
              formErrors.length > 0 || fallbackErrors.length > 0 ? "sm" : "xl"
            }
          >
            <Button type="submit" loading={isPending} fullWidth>
              {t("auth.verify.submit")}
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}
