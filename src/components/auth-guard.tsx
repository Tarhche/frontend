import {isUserLoggedIn} from "@/lib/auth";
import {type ReactNode} from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

export async function AuthGuard({fallback, children}: Props) {
  const isLoggedIn = await isUserLoggedIn();

  if (isLoggedIn) {
    return children;
  }

  return fallback ?? null;
}
