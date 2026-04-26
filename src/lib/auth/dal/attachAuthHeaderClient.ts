import {AxiosInstance} from "axios";
import JsCookie from "js-cookie";
import {ACCESS_TOKEN_COOKIE_NAME} from "@/constants";

export function attachAuthHeaderClient(dal: AxiosInstance) {
  dal.interceptors.request.use((request) => {
    const accessToken = JsCookie.get(ACCESS_TOKEN_COOKIE_NAME);
    if (accessToken) {
      request.headers["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete request.headers["Authorization"];
    }
    return request;
  });
}
