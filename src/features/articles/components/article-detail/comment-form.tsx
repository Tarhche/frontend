"use client";

import {useRef, useActionState} from "react";
import {Stack, Group, Text, Textarea, Button} from "@mantine/core";
import {AuthUserAvatar} from "@/components/auth-user-avatar";
import {
  IconSend,
  IconExclamationCircle,
  IconCircleDashedCheck,
} from "@tabler/icons-react";
import clsx from "clsx";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";
import {comment} from "../../actions/comment";
import classes from "./comment-form.module.css";

type Props = {
  objectUUID: string;
  parentUUID: string;
  languageCode: string;
};

const COMMENT_FIELDS = [
  "body",
  "object_uuid",
  "parent_uuid",
  "language_code",
] as const;

export function CommentForm({objectUUID, parentUUID, languageCode}: Props) {
  const t = useTranslations();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, isPending] = useActionState(comment, {});
  const isSuccessful = state.success;
  const isReplying = Boolean(parentUUID);

  if (isSuccessful) {
    formRef.current?.reset();
  }

  const bodyError = state.errors?.body;
  const formErrors = nonFieldErrors(state.errors, COMMENT_FIELDS);

  return (
    <form ref={formRef} action={dispatch}>
      <Stack gap={"xs"}>
        <Group align="start" gap={10}>
          <AuthUserAvatar />
          <Stack flex={1} gap={10}>
            <Textarea
              placeholder={
                isReplying
                  ? t("comments.form.replyPlaceholder")
                  : t("comments.form.commentPlaceholder")
              }
              rows={4}
              name="body"
              defaultValue={isSuccessful ? "" : (state.values?.body ?? "")}
              error={bodyError ?? ""}
              classNames={{
                input: clsx({
                  [classes.redBorder]: isSuccessful === false && !bodyError,
                }),
              }}
            />
            {isSuccessful && (
              <Text
                className={clsx(classes.text, classes.successText)}
                size="sm"
              >
                <IconCircleDashedCheck size={20} />
                {t("comments.form.success")}
              </Text>
            )}
            <ValidationErrorsAlert
              errors={formErrors}
              title={t("comments.form.submitFailedTitle")}
            />
            {isSuccessful === false && !state.errors && (
              <Text className={clsx(classes.text, classes.errorText)} size="sm">
                <IconExclamationCircle size={20} />
                {t("comments.form.genericError")}
              </Text>
            )}
          </Stack>
        </Group>
        <input name="object-uuid" value={objectUUID} hidden readOnly />
        <input name="parent-uuid" value={parentUUID} hidden readOnly />
        <input name="language-code" value={languageCode} hidden readOnly />
        <Button
          type="submit"
          leftSection={<IconSend size={20} />}
          loading={isPending}
          style={{
            alignSelf: "flex-end",
          }}
        >
          {t("comments.form.submit")}
        </Button>
      </Stack>
    </form>
  );
}
