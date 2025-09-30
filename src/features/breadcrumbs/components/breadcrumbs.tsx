import {Breadcrumbs} from "@/components/breadcrumbs";
import {APP_PATHS} from "@/lib/app-paths";

type Props = {
  crumbs: {
    label: string;
    href?: string;
  }[];
};

export function DashboardBreadcrumbs({crumbs}: Props) {
  return (
    <Breadcrumbs
      crumbs={[
        {
          label: "پنل کاربری",
          href: `${APP_PATHS.dashboard.index}`,
        },
        ...crumbs,
      ]}
    />
  );
}
