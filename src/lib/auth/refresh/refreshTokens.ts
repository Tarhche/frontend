import axios from "axios";
import {PUBLIC_BACKEND_URL} from "@/constants";

export type NewTokens = {
  access_token: string;
  refresh_token: string;
};

export async function refreshTokens(refreshToken: string): Promise<NewTokens> {
  const {data} = await axios.post(
    `${PUBLIC_BACKEND_URL}/api/auth/token/refresh`,
    {token: refreshToken},
  );
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}
