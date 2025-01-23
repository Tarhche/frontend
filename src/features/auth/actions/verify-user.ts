"use server";
import {DALDriverError} from "@/dal/dal-driver-error";
import {verifyUser as completeUserProfile} from "@/dal/public/auth";

type FormState = {
  success: boolean;
  errorMessages?: {
    name?: string[];
    password?: string[];
    repassword?: string[];
    username?: string[];
    token?: string[];
    _meta?: string[];
  };
};

export async function verifyUser(
  state: unknown,
  formData: unknown,
): Promise<FormState> {
  if (formData instanceof FormData) {
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (value instanceof File === false) {
        data[key] = value as string;
      }
    });
    try {
      await completeUserProfile(data);
      return {
        success: true,
      };
    } catch (e) {
      if (e instanceof DALDriverError) {
        const errors = e.response?.data?.errors || {};
        return {
          success: false,
          errorMessages: {
            ...errors,
            _meta: [errors?.token].filter((i) => Boolean(i)),
          },
        };
      }
    }
  }

  return {
    success: false,
    errorMessages: {
      _meta: ["عملیات با خطا مواجه شد لطفا دوباره تلاش نمایید"],
    },
  };
}
