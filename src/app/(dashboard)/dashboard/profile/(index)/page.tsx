import {Metadata} from "next";
import {Stack, Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {ProfileUpdateForm} from "@/features/profile/components";
import {fetchUserProfile} from "@/dal/private/profile";
import {fetchLanguages, type Language} from "@/dal/public/languages";

const PAGE_TITLE = "پروفایل";

export const metadata: Metadata = {
  title: PAGE_TITLE,
};

async function UserProfilePage() {
  const user = (await fetchUserProfile()).data;

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
            label: PAGE_TITLE,
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
            languageCode: user.language_code ?? defaultCode,
          }}
          languages={languages}
        />
      </Paper>
    </Stack>
  );
}

export default UserProfilePage;
