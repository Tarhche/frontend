"use client";

import {useRef, useActionState} from "react";
import {
  Box,
  Group,
  Stack,
  Select,
  InputLabel,
  TagsInput,
  Skeleton,
  Button,
} from "@mantine/core";
import {DateTimeInput} from "@/components/date-time-input";
import {type EditorRef} from "@/features/articles/components/article-editor";
import {LanguageSwitchField} from "./language-switch-field";
import {upsertNoteAction} from "../../actions/upsert-note";
import {isGregorianStartDateTime} from "@/lib/date-and-time";
import dynamic from "next/dynamic";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import type {Language} from "@/dal/public/languages";
import {type NotesScope} from "@/dal/private/notes";
import {useTranslations} from "@/i18n/provider";

// Notes are written with the same rich text editor as articles — file uploads,
// code blocks and all — so the editor component is shared rather than forked.
const NoteEditor = dynamic(
  async () => {
    const mod = await import("@/features/articles/components/article-editor");
    return mod.ArticleEditor;
  },
  {
    ssr: false,
    loading: () => <Skeleton w={"100%"} h={150} />,
  },
);

type Props = {
  mode: "create" | "update";
  // Which dashboard section the note is managed from: every author's notes, or
  // only the current user's.
  scope: NotesScope;
  // Present when editing within a translation group (edit route). Absent when
  // creating a brand-new note from scratch (the "new" page).
  correlationUuid?: string;
  languageCode?: string;
  note?: {
    defaultBody: string;
    defaultHashtags: string[];
    defaultPublishedAt: string;
  };
  languages: Language[];
  defaultLanguageCode: string;
};

const NOTE_UPSERT_FIELDS = [
  "body",
  "tags",
  "published_at",
  "language_code",
  "correlation_uuid",
] as const;

export function NoteUpsertForm({
  mode,
  scope,
  correlationUuid,
  languageCode,
  note,
  languages,
  defaultLanguageCode,
}: Props) {
  const t = useTranslations();
  const editorRef = useRef<EditorRef>(null);
  const [state, dispatch, isPending] = useActionState(upsertNoteAction, {
    success: true,
  });

  // The language is fixed by the route when editing a translation group; the
  // brand-new note form lets the author pick it.
  const isTranslationGroup = languageCode !== undefined;

  const defaultPublishedDate = note?.defaultPublishedAt
    ? isGregorianStartDateTime(note.defaultPublishedAt)
      ? null
      : new Date(note.defaultPublishedAt)
    : null;

  const handleSubmit = async (formData: FormData) => {
    if (Boolean(editorRef.current?.editor?.getData) === false) {
      throw new Error("NoteEditor getData is undefined");
    }
    formData.set("body", editorRef.current?.editor?.getData() || "");
    dispatch(formData);
  };

  const formErrors = nonFieldErrors(state.errors, NOTE_UPSERT_FIELDS);

  return (
    <form action={handleSubmit}>
      <ServerComponentErrorHandler state={state} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="scope" value={scope} />
      <input
        type="hidden"
        name="correlation_uuid"
        value={correlationUuid ?? ""}
      />
      {isTranslationGroup && (
        <input type="hidden" name="language_code" value={languageCode} />
      )}
      <Stack gap="lg">
        {isTranslationGroup ? (
          <LanguageSwitchField
            languages={languages}
            correlationUuid={correlationUuid as string}
            currentCode={languageCode as string}
            scope={scope}
          />
        ) : (
          <Select
            name="language_code"
            label={t("notes.form.languageLabel")}
            data={languages.map((language) => ({
              value: language.code,
              label: language.name,
            }))}
            defaultValue={state.values?.language_code ?? defaultLanguageCode}
            error={state.errors?.language_code ?? ""}
            allowDeselect={false}
          />
        )}
        <Box>
          <InputLabel>{t("notes.form.bodyLabel")}</InputLabel>
          <NoteEditor initialData={note?.defaultBody} editorRef={editorRef} />
          {state.errors?.body && (
            <Box c="red" fz="xs" mt={4}>
              {state.errors.body}
            </Box>
          )}
        </Box>
        <TagsInput
          name="tags"
          label={t("notes.form.tagsLabel")}
          splitChars={[" "]}
          defaultValue={note?.defaultHashtags || []}
          error={state.errors?.tags ?? ""}
          clearable
        />
        <DateTimeInput
          name="published_at"
          label={t("notes.form.publishedAtLabel")}
          defaultValue={defaultPublishedDate}
          error={state.errors?.published_at ?? ""}
          clearable
        />
        <ValidationErrorsAlert errors={formErrors} />
        <Group justify="flex-end" mt="lg">
          <Button type="submit" loading={isPending} disabled={isPending}>
            {mode === "update"
              ? t("notes.form.submitUpdate")
              : t("notes.form.submitCreate")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
