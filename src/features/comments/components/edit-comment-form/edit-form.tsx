"use client";

import {useActionState} from "react";
import {Group, Paper, Stack, Textarea, Button} from "@mantine/core";
import {DateTimeInput} from "@/components/date-time-input";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {updateCommentAction} from "../../actions/update-comment";
import {isGregorianStartDateTime} from "@/lib/date-and-time";
import {useTranslations} from "@/i18n/provider";

type Props = {
  id: string;
  objectId: string;
  parentId: string;
  message: string;
  approvalDate: string;
};

const COMMENT_EDIT_FIELDS = [
  "body",
  "message",
  "approved_at",
  "approvalDate",
  "object_uuid",
  "objectId",
  "parent_uuid",
  "parentId",
  "uuid",
  "id",
] as const;

export function EditCommentForm({
  message,
  approvalDate,
  parentId,
  id,
  objectId,
}: Props) {
  const t = useTranslations();
  const [state, dispatch, isPending] = useActionState(updateCommentAction, {
    success: true,
  });

  const bodyError = state.errors?.body;
  const approvedAtError = state.errors?.approved_at;
  const formErrors = nonFieldErrors(state.errors, COMMENT_EDIT_FIELDS);

  return (
    <Paper withBorder p="xl">
      <form action={dispatch}>
        <ServerComponentErrorHandler state={state} />
        <Stack>
          <Textarea
            label={t("comments.form.messageLabel")}
            name="message"
            rows={4}
            defaultValue={state.values?.message ?? message}
            error={bodyError ?? ""}
          />
          <DateTimeInput
            valueFormat="DD MMM YYYY hh:mm A"
            placeholder={t("comments.form.approvalDatePlaceholder")}
            label={t("comments.form.approvalDateLabel")}
            name="approvalDate"
            defaultValue={
              isGregorianStartDateTime(approvalDate) === true
                ? null
                : new Date(approvalDate)
            }
            error={approvedAtError ?? ""}
            clearable
          />
          <ValidationErrorsAlert errors={formErrors} />
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={isPending}>
              {state.success === false
                ? t("comments.form.editRetry")
                : t("comments.form.editSubmit")}
            </Button>
          </Group>
          <input type="text" name="id" value={id} readOnly hidden />
          <input type="text" name="objectId" value={objectId} readOnly hidden />
          <input type="text" name="parentId" value={parentId} readOnly hidden />
        </Stack>
      </form>
    </Paper>
  );
}
