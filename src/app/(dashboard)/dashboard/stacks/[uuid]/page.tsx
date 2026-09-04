import {type Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "@/components/link";
import {
  Box,
  Group,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Title,
} from "@mantine/core";
import {withPermissions} from "@/components/with-authorization";
import {DashboardBreadcrumbs} from "@/features/breadcrumbs/components/breadcrumbs";
import {getServerDictionary} from "@/i18n/server";
import {APP_PATHS} from "@/lib/app-paths";
import {fetchStack} from "@/dal/private/runner";
import {OwnerInline} from "@/features/dashboard/runner/components/owner-inline";
import {StateBadge} from "@/features/dashboard/runner/components/state-badge";
import {ContainerEndpoints} from "@/features/dashboard/runner/components/containers-table/container-endpoints";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();
  return {
    title: t("stacks.breadcrumb.detail"),
  };
}

type Props = {
  params: Promise<{uuid: string}>;
};

async function StackPage({params}: Props) {
  const {t} = await getServerDictionary();
  const {uuid} = await params;

  const stack = await fetchStack(uuid);
  if (!stack) {
    notFound();
  }

  return (
    <Box>
      <DashboardBreadcrumbs
        crumbs={[
          {label: t("stacks.title"), href: APP_PATHS.dashboard.stacks.index},
          {label: stack.name, href: APP_PATHS.dashboard.stacks.detail(uuid)},
        ]}
      />

      <Group justify="space-between" py="md">
        <Group gap="md">
          <Title order={2}>{stack.name}</Title>
          <OwnerInline owner={stack.owner} size={28} />
        </Group>
        <StateBadge state={stack.state} expectedState={stack.expected_state} />
      </Group>

      <TableScrollContainer minWidth={600}>
        <Table verticalSpacing="sm" striped withRowBorders>
          <TableThead>
            <TableTr>
              <TableTh>{t("stacks.detail.service")}</TableTh>
              <TableTh>{t("containers.table.image")}</TableTh>
              <TableTh>{t("containers.table.state")}</TableTh>
              <TableTh>{t("containers.table.endpoints")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {(stack.services ?? []).map(
              (service: {
                uuid: string;
                expected_state?: string;
                retries?: number;
                max_retries?: number;
                service_name: string;
                image: string;
                state: string;
                endpoints: {
                  container_port: number;
                  host: string;
                  url: string;
                }[];
              }) => (
                <TableTr key={service.uuid}>
                  <TableTd>
                    <Link
                      href={APP_PATHS.dashboard.containers.detail(service.uuid)}
                    >
                      {service.service_name}
                    </Link>
                  </TableTd>
                  <TableTd>{service.image}</TableTd>
                  <TableTd>
                    <StateBadge
                      state={service.state}
                      expectedState={service.expected_state}
                      retries={service.retries}
                      maxRetries={service.max_retries}
                    />
                  </TableTd>
                  <TableTd>
                    <ContainerEndpoints
                      endpoints={service.endpoints ?? []}
                      empty={t("containers.table.noEndpoints")}
                    />
                  </TableTd>
                </TableTr>
              ),
            )}
          </TableTbody>
        </Table>
      </TableScrollContainer>
    </Box>
  );
}

export default withPermissions(StackPage, {
  requiredPermissions: ["runner.stacks.show"],
});
