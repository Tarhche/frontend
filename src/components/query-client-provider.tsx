"use client";
import {ReactNode} from "react";
import {
  QueryClient,
  QueryClientProvider as RQProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import {notifications} from "@mantine/notifications";

function messageFor(status: number) {
  switch (status) {
    case 400:
      return "درخواست قابل پردازش نیست.";
    case 401:
      return "لطفاً برای ادامه وارد شوید.";
    case 403:
      return "شما مجوز انجام این عمل را ندارید.";
    case 404:
      return "مورد درخواستی یافت نشد.";
    case 409:
      return "این منبع قبلاً وجود دارد.";
    case 500:
      return "سرور دچار مشکل شده است. لطفاً بعداً دوباره تلاش کنید.";
    default:
      return "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
  }
}

function handleError(err: any) {
  const status = err.response?.status;
  if (status) {
    notifications.show({
      title: `خطا ${err.status}`,
      message: messageFor(err.status),
      color: err.status === 403 ? "yellow" : "red",
      withCloseButton: true,
    });
  } else {
    notifications.show({
      title: "خطای غیرمنتظره",
      message: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
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
