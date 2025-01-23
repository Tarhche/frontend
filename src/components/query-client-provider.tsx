"use client";
import {ReactNode} from "react";
import {
  QueryClient,
  QueryClientProvider as QueryClientProvider_,
} from "@tanstack/react-query";

type Props = {
  children: ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {},
  },
});

export function QueryClientProvider({children}: Props) {
  return (
    <QueryClientProvider_ client={queryClient}>{children}</QueryClientProvider_>
  );
}
