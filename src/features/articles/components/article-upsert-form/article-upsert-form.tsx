"use client";

import {useRef, useActionState} from "react";
import {
  Box,
  Group,
  Stack,
  Textarea,
  TextInput,
  Select,
  InputLabel,
  TagsInput,
  Skeleton,
  Button,
} from "@mantine/core";
import {DateTimeInput} from "@/components/date-time-input";
import {type EditorRef} from "@/features/articles/components/article-editor";
import {FileInput} from "./file-input";
import {LanguageSwitchField} from "./language-switch-field";
import {IconPhotoPlus, IconMovie} from "@tabler/icons-react";
import {upsertArticleAction} from "../../actions/upsert-article";
import {isGregorianStartDateTime} from "@/lib/date-and-time";
import dynamic from "next/dynamic";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import type {Language} from "@/dal/public/languages";
import {useTranslations} from "@/i18n/provider";

const ArticleEditor = dynamic(
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
  // Present when editing within a translation group (edit route). Absent when
  // creating a brand-new article from scratch (the "new" page).
  correlationUuid?: string;
  languageCode?: string;
  article?: {
    defaultTitle: string;
    defaultExcerpt: string;
    defaultBody: string;
    defaultHashtags: string[];
    defaultCover: string;
    defaultVideo: string;
    defaultPublishedAt: string;
  };
  languages: Language[];
  defaultLanguageCode: string;
};

const ARTICLE_UPSERT_FIELDS = [
  "title",
  "excerpt",
  "body",
  "cover",
  "video",
  "tags",
  "published_at",
  "language_code",
  "correlation_uuid",
] as const;

export function ArticleUpsertForm({
  mode,
  correlationUuid,
  languageCode,
  article,
  languages,
  defaultLanguageCode,
}: Props) {
  const t = useTranslations();
  const editorRef = useRef<EditorRef>(null);
  const [state, dispatch, isPending] = useActionState(upsertArticleAction, {
    success: true,
  });

  // The language is fixed by the route when editing a translation group; the
  // brand-new article form lets the author pick it.
  const isTranslationGroup = languageCode !== undefined;

  const defaultPublishedDate = article?.defaultPublishedAt
    ? isGregorianStartDateTime(article.defaultPublishedAt)
      ? null
      : new Date(article.defaultPublishedAt)
    : null;

  const handleSubmit = async (formData: FormData) => {
    if (Boolean(editorRef.current?.editor?.getData) === false) {
      throw new Error("ArticleEditor getData is undefined");
    }
    formData.set("body", editorRef.current?.editor?.getData() || "");
    dispatch(formData);
  };

  const formErrors = nonFieldErrors(state.errors, ARTICLE_UPSERT_FIELDS);

  return (
    <form action={handleSubmit}>
      <ServerComponentErrorHandler state={state} />
      <input type="hidden" name="mode" value={mode} />
      <input
        type="hidden"
        name="correlation_uuid"
        value={correlationUuid ?? ""}
      />
      {isTranslationGroup && (
        <input type="hidden" name="language_code" value={languageCode} />
      )}
      <Stack gap="lg">
        <TextInput
          name="title"
          label={t("articles.form.titleLabel")}
          defaultValue={state.values?.title ?? article?.defaultTitle ?? ""}
          error={state.errors?.title ?? ""}
        />
        {isTranslationGroup ? (
          <LanguageSwitchField
            languages={languages}
            correlationUuid={correlationUuid as string}
            currentCode={languageCode as string}
          />
        ) : (
          <Select
            name="language_code"
            label={t("articles.form.languageLabel")}
            data={languages.map((language) => ({
              value: language.code,
              label: language.name,
            }))}
            defaultValue={state.values?.language_code ?? defaultLanguageCode}
            error={state.errors?.language_code ?? ""}
            allowDeselect={false}
          />
        )}
        <Textarea
          name="excerpt"
          label={t("articles.form.excerptLabel")}
          defaultValue={state.values?.excerpt ?? article?.defaultExcerpt ?? ""}
          error={state.errors?.excerpt ?? ""}
          autosize
        />
        <Box>
          <InputLabel>{t("articles.form.bodyLabel")}</InputLabel>
          <ArticleEditor
            initialData={article?.defaultBody}
            editorRef={editorRef}
          />
          {state.errors?.body && (
            <Box c="red" fz="xs" mt={4}>
              {state.errors.body}
            </Box>
          )}
        </Box>
        <FileInput
          name="cover"
          label={t("articles.form.coverLabel")}
          defaultValue={article?.defaultCover || ""}
          icon={<IconPhotoPlus size={50} />}
          error={state.errors?.cover ?? ""}
        />
        <FileInput
          name="video"
          label={t("articles.form.videoLabel")}
          defaultValue={article?.defaultVideo || ""}
          icon={<IconMovie size={50} />}
          error={state.errors?.video ?? ""}
        />
        <TagsInput
          name="tags"
          label={t("articles.form.tagsLabel")}
          splitChars={[" "]}
          defaultValue={article?.defaultHashtags || []}
          error={state.errors?.tags ?? ""}
          clearable
        />
        <DateTimeInput
          name="published_at"
          label={t("articles.form.publishedAtLabel")}
          defaultValue={defaultPublishedDate}
          error={state.errors?.published_at ?? ""}
          clearable
        />
        <ValidationErrorsAlert errors={formErrors} />
        <Group justify="flex-end" mt="lg">
          <Button type="submit" loading={isPending} disabled={isPending}>
            {mode === "update"
              ? t("articles.form.submitUpdate")
              : t("articles.form.submitCreate")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
