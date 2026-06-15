"use client";

import {useEffect} from "react";
import {notifications} from "@mantine/notifications";
import type {ValidationErrorMap} from "@/lib/api/validation-errors";
import {useTranslations} from "@/i18n/provider";

type Props = {
  state:
    | {success?: boolean | null; errors?: ValidationErrorMap}
    | null
    | undefined;
};

function ServerComponentErrorHandler({state}: Props) {
  const t = useTranslations();
  useEffect(() => {
    if (state?.success === false && !state.errors) {
      notifications.show({
        title: t("errors.errorTitle"),
        message: t("errors.operationFailed"),
        color: "red",
      });
    }
  }, [state, t]);

  return null;
}

export default ServerComponentErrorHandler;
