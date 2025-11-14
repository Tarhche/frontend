"use client";

import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import {UnstyledButton} from "@mantine/core";
import {IconLogout} from "@tabler/icons-react";
import {logout} from "@/features/auth/actions";
import classes from "./layout.module.css";

export function DashboardLayoutLogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <form
      action={async () => {
        await logout();
        queryClient.setQueryData(["init-user"], {
          status: "unauthenticated",
        });
        router.push("/");
      }}
    >
      <UnstyledButton w={"100%"} type="submit" className={classes.link}>
        <IconLogout className={classes.linkIcon} stroke={1.5} />
        <span>خروج</span>
      </UnstyledButton>
    </form>
  );
}
