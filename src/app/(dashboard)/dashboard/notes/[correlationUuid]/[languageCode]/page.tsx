import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {Stack, Paper, Alert} from "@mantine/core";
import {IconLanguage} from "@tabler/icons-react";
import {NoteUpsertForm} from "@/features/notes/components/note-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {fetchNoteTranslation} from "@/dal/private/notes";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("notes.dashboard.editMetaTitle"),
  };
}

type Props = {
  params: Promise<{
    correlationUuid?: string;
    languageCode?: string;
  }>;
};

async function NoteDetailPage({params}: Props) {
  const {correlationUuid, languageCode} = await params;
  if (!correlationUuid || !languageCode) {
    notFound();
  }

  const {t} = await getServerDictionary();

  let languages: Language[] = [];
  let defaultLanguageCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultLanguageCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if unavailable.
  }

  // When the selected language has no translation yet, offer to create one
  // under the same correlation group instead of rendering the not-found page.
  const note = await fetchNoteTranslation("all", correlationUuid, languageCode);
  const isMissingTranslation = note === null;

  const selectedLanguageName =
    languages.find((language) => language.code === languageCode)?.name ??
    languageCode;

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("notes.dashboard.listCrumb"),
            href: APP_PATHS.dashboard.notes.index,
          },
          {
            label: isMissingTranslation
              ? t("notes.dashboard.newTranslationCrumb")
              : t("notes.dashboard.editCrumb"),
          },
        ]}
      />
      {isMissingTranslation && (
        <Alert
          color="blue"
          icon={<IconLanguage size={18} />}
          title={t("notes.form.missingTranslationTitle")}
        >
          {t("notes.form.missingTranslationText", {
            language: selectedLanguageName,
          })}
        </Alert>
      )}
      <Paper p="md" withBorder>
        <NoteUpsertForm
          mode={isMissingTranslation ? "create" : "update"}
          scope="all"
          correlationUuid={correlationUuid}
          languageCode={languageCode}
          languages={languages}
          defaultLanguageCode={defaultLanguageCode}
          note={
            isMissingTranslation
              ? undefined
              : {
                  defaultBody: note.body,
                  defaultHashtags: note.tags,
                  defaultPublishedAt: note.published_at,
                }
          }
        />
      </Paper>
    </Stack>
  );
}

export default withPermissions(NoteDetailPage, {
  requiredPermissions: ["notes.show", "notes.update"],
  operator: "AND",
});
