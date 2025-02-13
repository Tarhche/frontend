import {notFound} from "next/navigation";
import {cookies, headers} from "next/headers";
import axios, {InternalAxiosRequestConfig, isAxiosError} from "axios";
import {
  INTERNAL_BACKEND_URL,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  USER_PERMISSIONS_COOKIE_NAME,
  REFRESH_TOKEN_EXP,
  ACCESS_TOKEN_EXP,
} from "@/constants";
import {DALDriverError} from "../dal-driver-error";

const BASE_URL = `${INTERNAL_BACKEND_URL}/api`;
export const privateDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

async function handleRequestResolve(config: InternalAxiosRequestConfig) {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (accessToken !== undefined && config.headers.Authorization === undefined) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}

privateDalDriver.interceptors.request.use(
  handleRequestResolve,
  async (error) => error,
);

async function handleResponseRejection(response: any) {
  const cookiesStore = await cookies();
  const headersStore = await headers();

  const isFromApiRoutes = headersStore.has("client-to-proxy");
  const isFromServerAction = headersStore.has("next-action");

  const refreshToken = cookiesStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const hasRefreshToken = Boolean(refreshToken?.trim());

  const isRequestNotFound = response?.status === 404;
  const isRequestUnauthorized = response?.status === 401;
  const originalRequest = response?.config;

  if (isRequestNotFound) {
    notFound();
  }
  if (isRequestUnauthorized && hasRefreshToken === false) {
    throw new DALDriverError("Unauthorized access", 401);
  }
  if (isRequestUnauthorized && hasRefreshToken) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/token/refresh`, {
        token: refreshToken,
      });
      const {access_token, refresh_token} = response.data;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      const originalRequestResponse = await axios(originalRequest);

      if (isFromApiRoutes || isFromServerAction) {
        const userRoles = (
          await axios.get(`${BASE_URL}/dashboard/profile/roles`, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          })
        ).data;
        // If a request is made from either a server action or route handler, we can safely set cookies.
        // Refer to the Next.js documentation for more details: https://nextjs.org/docs/app/api-reference/functions/cookies#good-to-know
        cookiesStore.set(ACCESS_TOKEN_COOKIE_NAME, access_token, {
          httpOnly: true,
          maxAge: ACCESS_TOKEN_EXP,
          path: "/",
        });
        cookiesStore.set(REFRESH_TOKEN_COOKIE_NAME, refresh_token, {
          httpOnly: true,
          maxAge: REFRESH_TOKEN_EXP,
          path: "/",
        });
        cookiesStore.set(
          USER_PERMISSIONS_COOKIE_NAME,
          btoa(
            JSON.stringify(
              Array.from(
                new Set(
                  userRoles.items.flatMap((item: any) => item.permissions),
                ),
              ),
            ),
          ),
          {
            maxAge: REFRESH_TOKEN_EXP,
          },
        );
      }
      return originalRequestResponse;
    } catch (err) {
      if (isAxiosError(err)) {
        console.log(err.message);
        throw new DALDriverError(err.message, err.status!, err.response);
      }
      throw new DALDriverError(
        "An error occured while refreshing user's token",
        500,
      );
    }
  }
  if (isAxiosError(response)) {
    throw new DALDriverError("", response.status!, {
      data: response.response?.data,
    });
  }
  throw new DALDriverError(
    "Something unexpected happened while fetching a resource from backend",
    500,
  );
}

privateDalDriver.interceptors.response.use(
  (value) => value,
  handleResponseRejection,
);
