import {AxiosInstance} from "axios";
import {cookies} from "next/headers";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";

export function attachAuthHeaderServer(dal: AxiosInstance) {
  dal.interceptors.request.use(async (request) => {
    const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;
    if (accessToken) {
      request.headers["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete request.headers["Authorization"];
    }
    return request;
  });
}
