import {notFound} from "next/navigation";
import axios, {AxiosError} from "axios";
import {DALDriverError} from "@/dal/dal-driver-error";
import {INTERNAL_BACKEND_URL} from "@/constants";

const BASE_URL = `${INTERNAL_BACKEND_URL}/api`;

export const publicDalDriver = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

publicDalDriver.interceptors.response.use(
  (value) => value,
  (error) => {
    if (error instanceof AxiosError) {
      if (error.status === 404) {
        notFound();
      }

      throw new DALDriverError(error.message, error.status || 500, {
        data: error.response?.data ?? {},
      });
    }

    throw new DALDriverError(
      "Unexpected error while fetching data from backend",
      500,
    );
  },
);
