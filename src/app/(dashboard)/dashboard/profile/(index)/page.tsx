import {Metadata} from "next";
import {Stack, Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {ProfileUpdateForm} from "@/features/profile/components";
import {fetchUserProfile} from "@/dal/private/profile";
import {fetchLanguages, type Language} from "@/dal/public/languages";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("profile.title"),
  };
}

async function UserProfilePage() {
  const {t} = await getServerDictionary();
  const user = (await fetchUserProfile()).data;

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
            label: t("profile.title"),
          },
        ]}
      />
      <Paper p="lg" withBorder>
        <ProfileUpdateForm
          userInfo={{
            name: user.name,
            email: user.email,
            username: user.username,
            avatar: user.avatar,
            languageCode: user.language_code ?? defaultLanguageCode,
          }}
          languages={languages}
        />
      </Paper>
    </Stack>
  );
}

export default UserProfilePage;
