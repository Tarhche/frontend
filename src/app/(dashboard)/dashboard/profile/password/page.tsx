import {Metadata} from "next";
import {Stack} from "@mantine/core";
import {Paper} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {ProfilePasswordForm} from "@/features/profile/components";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("profile.password.title"),
  };
}

async function ChangePasswordPage() {
  const {t} = await getServerDictionary();
  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("profile.title"),
            href: APP_PATHS.dashboard.profile.index,
          },
          {
            label: t("profile.password.title"),
          },
        ]}
      />
      <Paper p="lg" withBorder>
        <ProfilePasswordForm />
      </Paper>
    </Stack>
  );
}

export default ChangePasswordPage;
