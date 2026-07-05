import axios from "axios";
import {INTERNAL_BACKEND_URL} from "@/constants";

export type NewTokens = {
  access_token: string;
  refresh_token: string;
};

// Server-only: uses the internal backend URL, which is unreachable from the
// browser. Client code refreshes via the /api/auth/refresh route instead.
export async function refreshTokens(
  refreshToken: string,
  clientIp?: string | null,
): Promise<NewTokens> {
  const {data} = await axios.post(
    `${INTERNAL_BACKEND_URL}/api/auth/token/refresh`,
    {token: refreshToken},
    clientIp ? {headers: {"x-forwarded-for": clientIp}} : undefined,
  );
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}
