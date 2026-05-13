"use client";

import {useEffect} from "react";
import {notifications} from "@mantine/notifications";
import type {ValidationErrorMap} from "@/lib/api/validation-errors";

type Props = {
  state:
    | {success?: boolean | null; errors?: ValidationErrorMap}
    | null
    | undefined;
};

function ServerComponentErrorHandler({state}: Props) {
  useEffect(() => {
    if (state?.success === false && !state.errors) {
      notifications.show({
        title: "خطا",
        message: "عملیات به مشکل خورد.",
        color: "red",
      });
    }
  }, [state]);

  return null;
}

export default ServerComponentErrorHandler;
