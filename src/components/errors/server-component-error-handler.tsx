"use client";

import {useEffect} from "react";
import {notifications} from "@mantine/notifications";

function ServerComponentErrorHandler({state}) {
  useEffect(() => {
    if (state?.success === false) {
      notifications.show({
        title: "خطا",
        message: `عملیات به مشکل خورد.${state.status ? ` (${state.status})` : ""}`,
        color: "red",
      });
    }
  }, [state]);

  return null;
}

export default ServerComponentErrorHandler;
