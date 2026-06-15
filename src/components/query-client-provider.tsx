"use client";

import {ReactNode} from "react";
import {
  QueryClient,
  QueryClientProvider as RQProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import {notifications} from "@mantine/notifications";
import {getClientDictionary} from "@/i18n/provider";
import type {TFunction} from "@/i18n/dictionary";

function messageFor(t: TFunction, status: number) {
  switch (status) {
    case 400:
      return t("errors.http.badRequest");
    case 401:
      return t("errors.http.unauthorized");
    case 403:
      return t("errors.http.forbidden");
    case 404:
      return t("errors.http.notFound");
    case 409:
      return t("errors.http.conflict");
    case 500:
      return t("errors.http.serverError");
    default:
      return t("errors.http.generic");
  }
}

function handleError(err: any) {
  const {t} = getClientDictionary();
  const status = err.response?.status;
  if (status) {
    notifications.show({
      title: `${t("errors.errorTitle")} ${err.status}`,
      message: messageFor(t, err.status),
      color: err.status === 403 ? "yellow" : "red",
      withCloseButton: true,
    });
  } else {
    notifications.show({
      title: t("errors.unexpectedError"),
      message: t("errors.http.generic"),
      color: "red",
    });
  }
}

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => handleError(err),
    }),
    mutationCache: new MutationCache({
      onError: (err, _vars, _ctx, mutation) => {
        // Let a mutation-specific onError override the global one
        if (!mutation.options.onError) handleError(err);
      },
    }),
    defaultOptions: {
      queries: {
        // sensible defaults
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

type Props = {children: ReactNode};

export function QueryClientProvider({children}: Props) {
  const queryClient = createQueryClient();

  return <RQProvider client={queryClient}>{children}</RQProvider>;
}
