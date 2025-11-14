import {notFound} from "next/navigation";
import {Stack, Paper} from "@mantine/core";
import {ElementUpsertForm} from "@/features/dashboard/elements/components/element-upsert-form";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {withPermissions} from "@/components/with-authorization";
import {fetchElement} from "@/dal/private/elements";
import {APP_PATHS} from "@/lib/app-paths";

export const metadata = {
  title: "جزییات المان",
};

type Props = {
  params: Promise<{
    uuid?: string;
  }>;
};

async function ElementDetailPage({params}: Props) {
  const elementId = (await params).uuid;
  if (elementId === undefined) {
    notFound();
  }

  const element = await fetchElement(elementId);

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
        <ElementUpsertForm element={element} />
      </Paper>
    </Stack>
  );
}

export default withPermissions(ElementDetailPage, {
  requiredPermissions: ["elements.show", "elements.update"],
  operator: "AND",
});
