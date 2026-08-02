import {type Metadata} from "next";
import {Box, Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {NoteUpsertForm} from "@/features/notes/components/note-upsert-form";
import {withPermissions} from "@/components/with-authorization";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("notes.dashboard.newMetaTitle"),
  };
}

async function NewMyNotePage() {
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

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("notes.dashboard.myListCrumb"),
            href: APP_PATHS.dashboard.notes.list("own"),
          },
          {
            label: t("notes.dashboard.newCrumb"),
          },
        ]}
      />
      <Paper p={"md"} mt={"md"} withBorder>
        <NoteUpsertForm
          mode="create"
          scope="own"
          languages={languages}
          defaultLanguageCode={defaultLanguageCode}
        />
      </Paper>
    </Box>
  );
}

export default withPermissions(NewMyNotePage, {
  requiredPermissions: ["self.notes.create"],
});
