import "server-only";
import axios from "axios";
import {INTERNAL_BACKEND_URL} from "@/constants";

export type SessionProfile = {
  uuid: string;
  name?: string;
  username?: string;
  avatar?: string;
  email?: string;
  language_code?: string;
  impersonated_by?: {
    uuid: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
};

/**
 * Reads a profile with a token that is not the one in the cookies.
 *
 * The private DAL signs every request as whoever the browser is currently
 * signed in as, which is exactly what an account being remembered or switched
 * to is not yet. Returns null rather than throwing: a session worth recording
 * is still worth recording without a name on it.
 */
export async function fetchProfileWithToken(
  accessToken: string,
): Promise<SessionProfile | null> {
  try {
    const {data} = await axios.get<SessionProfile>(
      `${INTERNAL_BACKEND_URL}/api/dashboard/profile`,
      {headers: {Authorization: `Bearer ${accessToken}`}},
    );

    return data;
  } catch {
    return null;
  }
}
