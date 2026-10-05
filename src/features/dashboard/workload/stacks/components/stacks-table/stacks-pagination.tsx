"use client";

import {usePathname, useSearchParams} from "next/navigation";
import Link from "@/components/link";
import {Pagination} from "@mantine/core";

type Props = {
  current: number;
  total: number;
};

/** Pages of a listing, each one an address of its own. */
export function StacksPagination({current, total}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const href = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(Math.min(Math.max(page, 1), total)));

    return `${pathname}?${params.toString()}`;
  };

  return (
    <Pagination
      total={total}
      value={current}
      size="md"
      getItemProps={(page) => ({component: Link, href: href(page)})}
      getControlProps={(control) => {
        switch (control) {
          case "first":
            return {component: Link, href: href(1), scroll: false};
          case "last":
            return {component: Link, href: href(total), scroll: false};
          case "next":
            return {component: Link, href: href(current + 1), scroll: false};
          case "previous":
            return {component: Link, href: href(current - 1), scroll: false};
        }
      }}
    />
  );
}
