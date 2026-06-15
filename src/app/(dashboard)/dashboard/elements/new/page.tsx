import {Stack, Paper} from "@mantine/core";
import {ElementUpsertForm} from "@/features/dashboard/elements/components/element-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";

export async function generateMetadata() {
  const {t} = await getServerDictionary();
  return {
    title: t("elements.breadcrumb.create"),
  };
}

async function ElementDetailPage() {
  const {t} = await getServerDictionary();

  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("elements.title"),
            href: APP_PATHS.dashboard.elements.index,
          },
          {
            label: t("elements.breadcrumb.edit"),
          },
        ]}
      />
      <Paper p="md" withBorder>
        <ElementUpsertForm />
      </Paper>
    </Stack>
  );
}

export default withPermissions(ElementDetailPage, {
  requiredPermissions: ["elements.show", "elements.update"],
  operator: "AND",
});
