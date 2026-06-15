import {Metadata} from "next";
import {notFound} from "next/navigation";
import {Box, Stack} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {UserPasswordForm} from "@/features/users/components";
import {withPermissions} from "@/components/with-authorization";
import {fetchUser} from "@/dal/private/users";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("users.page.changePasswordTitle"),
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

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("users.page.breadcrumbUsers"),
            href: APP_PATHS.dashboard.users.index,
          },
          {
            label: userData.name,
            href: APP_PATHS.dashboard.users.edit(userData.uuid),
          },
          {
            label: t("users.page.changePasswordTitle"),
          },
        ]}
      />
      <Box>
        <UserPasswordForm userId={userId} />
      </Box>
    </Stack>
  );
}

export default withPermissions(UpdateUserPage, {
  requiredPermissions: ["users.password.update"],
});
