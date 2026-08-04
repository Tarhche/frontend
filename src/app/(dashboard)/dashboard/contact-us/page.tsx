import {type Metadata} from "next";
import {Suspense} from "react";
import {Box} from "@mantine/core";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {
  ContactMessagesTable,
  ContactMessagesTableSkeleton,
} from "@/features/contact/components/messages-table";
import {withPermissions} from "@/components/with-authorization";
import {APP_PATHS} from "@/lib/app-paths";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();

  return {
    title: t("contactUs.dashboard.title"),
  };
}

type Props = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function ContactUsPage({searchParams}: Props) {
  const {t} = await getServerDictionary();
  const {page} = await searchParams;

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {
            label: t("contactUs.dashboard.title"),
            href: APP_PATHS.dashboard.contactUs.index,
          },
        ]}
      />
      <Box mt={"md"}>
        <Suspense key={page} fallback={<ContactMessagesTableSkeleton />}>
          <ContactMessagesTable page={page ?? 1} />
        </Suspense>
      </Box>
    </Box>
  );
}

export default withPermissions(ContactUsPage, {
  requiredPermissions: ["contactus.index"],
});
