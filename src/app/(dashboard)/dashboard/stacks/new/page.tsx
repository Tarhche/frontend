import {type Metadata} from "next";
import {Box} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {StackForm} from "@/features/dashboard/runner/components/stack-form";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("stacks.breadcrumb.create"),
  };
}

async function NewStackPage() {
  const {t} = await getServerDictionary();

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("stacks.title"),
            href: APP_PATHS.dashboard.stacks.index,
          },
          {
            label: t("stacks.breadcrumb.create"),
            href: APP_PATHS.dashboard.stacks.new,
          },
        ]}
      />
      <Box py="md">
        <StackForm />
      </Box>
    </Box>
  );
}

export default withPermissions(NewStackPage, {
  requiredPermissions: ["runner.stacks.create"],
});
