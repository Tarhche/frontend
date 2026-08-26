"use client";

import {useActionState} from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import {IconCircleCheck} from "@tabler/icons-react";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {sendContactMessageAction} from "../../actions/send-message";

const CONTACT_FIELDS = ["subject", "body", "email", "phone"] as const;

export function ContactForm() {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(
    sendContactMessageAction,
    {},
  );

  const formErrors = nonFieldErrors(state.errors, CONTACT_FIELDS);

  if (state.success === true) {
    return (
      <Paper withBorder p="xl">
        <Alert
          variant="light"
          color="green"
          title={t("contactUs.form.successTitle")}
          icon={<IconCircleCheck />}
        >
          {t("contactUs.form.success")}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper withBorder p="xl">
      <Title order={2}>{t("contactUs.form.title")}</Title>
      <Text c="dimmed" size="sm" mt="xs">
        {t("contactUs.form.description")}
      </Text>
      <Box component="form" action={dispatch} mt="lg">
        <Stack>
          <TextInput
            label={t("contactUs.form.subjectLabel")}
            placeholder={t("contactUs.form.subjectPlaceholder")}
            name="subject"
            defaultValue={state.values?.subject ?? ""}
            error={state.errors?.subject ?? ""}
            required
          />
          <Textarea
            label={t("contactUs.form.bodyLabel")}
            placeholder={t("contactUs.form.bodyPlaceholder")}
            name="body"
            rows={6}
            defaultValue={state.values?.body ?? ""}
            error={state.errors?.body ?? ""}
            required
          />
          {/* Neither field is required on its own, but one of the two is — the
              backend is the one that decides, and says so per field. */}
          <TextInput
            label={t("contactUs.form.emailLabel")}
            placeholder="you@email.com"
            name="email"
            type="email"
            defaultValue={state.values?.email ?? ""}
            error={state.errors?.email ?? ""}
            description={t("contactUs.form.contactHint")}
          />
          <TextInput
            label={t("contactUs.form.phoneLabel")}
            placeholder={t("contactUs.form.phonePlaceholder")}
            name="phone"
            inputMode="numeric"
            defaultValue={state.values?.phone ?? ""}
            error={state.errors?.phone ?? ""}
          />
          {state.success === false && (
            <ValidationErrorsAlert
              errors={
                formErrors.length > 0
                  ? formErrors
                  : state.errors
                    ? []
                    : [t("contactUs.form.genericError")]
              }
              title={t("contactUs.form.failedTitle")}
            />
          )}
          <Button type="submit" loading={isPending} mt="xs">
            {t("contactUs.form.submit")}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
