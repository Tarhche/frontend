import {AxiosError, AxiosInstance, InternalAxiosRequestConfig} from "axios";

const REFRESH_ENDPOINT = "/api/auth/refresh";

type RetriedConfig = InternalAxiosRequestConfig & {__authRetried?: boolean};

let inFlightRefresh: Promise<void> | null = null;

async function callRefresh() {
  if (inFlightRefresh) return inFlightRefresh;
  inFlightRefresh = fetch(REFRESH_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
  })
    .then((res) => {
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
    })
    .finally(() => {
      inFlightRefresh = null;
    });
  return inFlightRefresh;
}

export function clientRefreshOn401(dal: AxiosInstance) {
  dal.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetriedConfig | undefined;
      if (!config || error.response?.status !== 401 || config.__authRetried) {
        return Promise.reject(error);
      }
      config.__authRetried = true;
      try {
        await callRefresh();
      } catch (e) {
        return Promise.reject(error);
      }
      return dal.request(config);
    },
  );
}
