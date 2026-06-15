import {Metadata} from "next";
import {notFound} from "next/navigation";
import {Box, Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {UpsertUserForm} from "@/features/users/components/upsert-user-form";
import {withPermissions} from "@/components/with-authorization";
import {fetchUser} from "@/dal/private/users";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("users.page.updateTitle"),
  };
}

type Props = {
  params: Promise<{
    id?: string;
  }>;
};

async function UpdateUserPage({params}: Props) {
  const {t} = await getServerDictionary();
  const userId = (await params).id;
  if (userId === undefined) {
    notFound();
  }
  const userData = await fetchUser(userId);

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
            label: t("users.page.updateTitle"),
          },
        ]}
      />
      <Box>
        <UpsertUserForm
          userInfo={{
            userId: userData.uuid,
            defaultAvatar: userData.avatar,
            defaultName: userData.name,
            defaultEmail: userData.email,
            defaultUsername: userData.username,
            defaultLanguageCode: userData.language_code ?? defaultLanguageCode,
          }}
          languages={languages}
        />
      </Box>
    </Stack>
  );
}

export default withPermissions(UpdateUserPage, {
  requiredPermissions: ["users.show", "users.update"],
  operator: "AND",
});
