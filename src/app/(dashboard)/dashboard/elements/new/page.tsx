import {Stack, Paper} from "@mantine/core";
import {ElementUpsertForm} from "@/features/dashboard/elements/components/element-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {APP_PATHS} from "@/lib/app-paths";

export const metadata = {
  title: "المان جدید",
};

async function ElementDetailPage() {
  return (
    <Stack>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: "المان ها",
            href: APP_PATHS.dashboard.elements.index,
          },
          {
            label: "ویرایش المان",
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
