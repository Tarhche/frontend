import {Metadata} from "next";
import {Stack, Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {AppSettingForm} from "@/features/settings/components/app-setting-form";
import {fetchConfigs} from "@/dal/private/config";
import {fetchLanguages} from "@/dal/private/languages";
import {type Language} from "@/dal/public/languages";
import {withPermissions} from "@/components/with-authorization";

const PAGE_TITLE = "تنظیمات";

export const metadata: Metadata = {
  title: PAGE_TITLE,
};

async function SettingsPage() {
  const config = await fetchConfigs();

  // Uses the dashboard languages endpoint (not the public /api/languages, which
  // errors until a site default is configured) so the default can be chosen here
  // even before one exists.
  let languages: Language[] = [];
  try {
    languages = (await fetchLanguages()).items ?? [];
  } catch {
    // Fail open: the default-language select renders empty if unavailable.
  }

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: PAGE_TITLE,
          },
        ]}
      />
      <Paper p="lg" withBorder>
        <AppSettingForm
          config={{
            userDefaultRoles: config.user_default_roles.join(""),
            defaultLanguageCode: config.default_language_code ?? "",
          }}
          languages={languages}
        />
      </Paper>
    </Stack>
  );
}

export default withPermissions(SettingsPage, {
  requiredPermissions: ["config.update"],
});
