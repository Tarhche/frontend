import {Metadata} from "next";
import {Box, Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {UpsertUserForm} from "@/features/users/components";
import {withPermissions} from "@/components/with-authorization";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("users.page.newTitle"),
  };
}

async function NewUserPage() {
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
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("users.page.breadcrumbUsers"),
            href: APP_PATHS.dashboard.users.index,
          },
          {
            label: t("users.page.newTitle"),
          },
        ]}
      />
      <Box>
        <UpsertUserForm
          userInfo={{defaultLanguageCode: defaultLanguageCode}}
          languages={languages}
        />
      </Box>
    </Stack>
  );
}

export default withPermissions(NewUserPage, {
  requiredPermissions: ["users.create"],
});
