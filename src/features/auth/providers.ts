import "server-only";
import {fetchLoginProviders} from "@/dal/public/auth";

/**
 * What may be signed in with besides a password.
 *
 * The backend offers only the providers it was given secrets for, so this is
 * what can actually be used. It fails open to nothing: a login page that cannot
 * reach the backend still has its form, and shows no button that would not work
 * anyway.
 */
export async function loginProviders(): Promise<string[]> {
  try {
    const data = await fetchLoginProviders();

    return (data?.items ?? [])
      .map((item: {name?: string}) => item?.name)
      .filter((name: unknown): name is string => typeof name === "string");
  } catch {
    return [];
  }
}
