"use client";

import Link from "@/components/link";
import {useMemo} from "react";
import {UnstyledButton, Skeleton} from "@mantine/core";
import {useInit} from "@/hooks/data/init";
import {useTranslations} from "@/i18n/provider";
import classes from "./auth-buttons.module.css";

export function AuthButtons() {
  const {data, isLoading} = useInit();
  const status = data?.status;
  const t = useTranslations();

  const LINKS = useMemo(() => {
    const authLinks = [
      {label: t("nav.login"), href: "/auth/login"},
      {label: t("nav.register"), href: "/auth/register"},
    ];
    if (isLoading) {
      return (
        <Skeleton>
          <UnstyledButton>XXXXXXXXXX</UnstyledButton>
        </Skeleton>
      );
    }
    if (status === "unauthenticated") {
      return authLinks.map((link) => {
        return (
          <UnstyledButton
            key={link.href}
            className={classes.control}
            component={Link}
            href={link.href}
          >
            {link.label}
          </UnstyledButton>
        );
      });
    }
    if (status === "authenticated") {
      return (
        <UnstyledButton
          className={classes.control}
          component={Link}
          href={"/dashboard"}
        >
          {t("nav.dashboard")}
        </UnstyledButton>
      );
    }
  }, [status, isLoading, t]);

  return LINKS;
}
