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
import {ConnectArticleField} from "./connect-article-field";
import {IconPhotoPlus, IconMovie} from "@tabler/icons-react";
import {upsertArticleAction} from "../../actions/upsert-article";
import {isGregorianStartDateTime} from "@/lib/date-and-time";
import dynamic from "next/dynamic";
import {ValidationErrorsAlert} from "@/components/errors/validation-errors-alert";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {nonFieldErrors} from "@/lib/api/validation-errors";
import type {Language} from "@/dal/public/languages";

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
  article?: {
    articleId: string;
    defaultTitle: string;
    defaultExcerpt: string;
    defaultBody: string;
    defaultHashtags: string[];
    defaultCover: string;
    defaultVideo: string;
    defaultPublishedAt: string;
    defaultLanguageCode: string;
    defaultCorrelationUuid: string;
  };
  languages: Language[];
  defaultCode: string;
  connectableArticles: {uuid: string; title: string}[];
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
  "uuid",
] as const;

export function ArticleUpsertForm({
  article,
  languages,
  defaultCode,
  connectableArticles,
}: Props) {
  const editorRef = useRef<EditorRef>(null);
  const [state, dispatch, isPending] = useActionState(upsertArticleAction, {
    success: true,
  });

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
    if (article?.articleId) {
      formData.set("uuid", article.articleId);
    }
    dispatch(formData);
  };

  const formErrors = nonFieldErrors(state.errors, ARTICLE_UPSERT_FIELDS);

  return (
    <form action={handleSubmit}>
      <ServerComponentErrorHandler state={state} />
      <Stack gap="lg">
        <TextInput
          name="title"
          label="عنوان مقاله"
          defaultValue={state.values?.title ?? article?.defaultTitle ?? ""}
          error={state.errors?.title ?? ""}
        />
        <Select
          name="language_code"
          label="زبان"
          data={languages.map((language) => ({
            value: language.code,
            label: language.name,
          }))}
          defaultValue={
            state.values?.language_code ??
            article?.defaultLanguageCode ??
            defaultCode
          }
          error={state.errors?.language_code ?? ""}
          allowDeselect={false}
        />
        <ConnectArticleField
          articles={connectableArticles}
          defaultCorrelationUuid={article?.defaultCorrelationUuid}
          ownUuid={article?.articleId}
        />
        <Textarea
          name="excerpt"
          label="خلاصه محتوا"
          defaultValue={state.values?.excerpt ?? article?.defaultExcerpt ?? ""}
          error={state.errors?.excerpt ?? ""}
          autosize
        />
        <Box>
          <InputLabel>محتوا</InputLabel>
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
          label="کاور"
          defaultValue={article?.defaultCover || ""}
          icon={<IconPhotoPlus size={50} />}
          error={state.errors?.cover ?? ""}
        />
        <FileInput
          name="video"
          label="ویدئو"
          defaultValue={article?.defaultVideo || ""}
          icon={<IconMovie size={50} />}
          error={state.errors?.video ?? ""}
        />
        <TagsInput
          name="tags"
          label="تگ ها"
          splitChars={[" "]}
          defaultValue={article?.defaultHashtags || []}
          error={state.errors?.tags ?? ""}
          clearable
        />
        <DateTimeInput
          name="published_at"
          label="تاریخ انتشار"
          defaultValue={defaultPublishedDate}
          error={state.errors?.published_at ?? ""}
          clearable
        />
        <ValidationErrorsAlert errors={formErrors} />
        <Group justify="flex-end" mt="lg">
          <Button type="submit" loading={isPending} disabled={isPending}>
            {article?.articleId ? "بروزرسانی مقاله" : "ایجاد مقاله"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
