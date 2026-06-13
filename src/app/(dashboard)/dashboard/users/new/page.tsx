import {Metadata} from "next";
import {Box, Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {UpsertUserForm} from "@/features/users/components";
import {withPermissions} from "@/components/with-authorization";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {APP_PATHS} from "@/lib/app-paths";

const PAGE_TITLE = "کاربر جدید";

export const metadata: Metadata = {
  title: PAGE_TITLE,
};

async function NewUserPage() {
  let languages: Language[] = [];
  let defaultCode = "";
  try {
    const data = await fetchLanguages();
    languages = data.items ?? [];
    defaultCode = data.default_language?.code ?? "";
  } catch {
    // Fail open: the language select renders empty if unavailable.
  }

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: "کاربرها",
            href: APP_PATHS.dashboard.users.index,
          },
          {
            label: PAGE_TITLE,
          },
        ]}
      />
      <Box>
        <UpsertUserForm
          userInfo={{defaultLanguageCode: defaultCode}}
          languages={languages}
        />
      </Box>
    </Stack>
  );
}

export default withPermissions(NewUserPage, {
  requiredPermissions: ["users.create"],
});
