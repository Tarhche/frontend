"use server";
import {cookies} from "next/headers";
import {DALDriverError} from "@/dal/dal-driver-error";
import {loginUser} from "@/dal/public/auth";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  USER_PERMISSIONS_COOKIE_NAME,
} from "@/constants/strings";
import {ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP} from "@/constants/numbers";

type FormState = {
  success: boolean;
  errorMessages?: string[];
} | null;

export async function login(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const identity = formData.get("identity")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const shouldPersistUser =
    formData.get("remember")?.toString() === "on" ? true : false;
  const isDataValid =
    typeof identity === "string" &&
    typeof password === "string" &&
    typeof shouldPersistUser === "boolean";
  if (isDataValid) {
    try {
      const response = await loginUser(identity, password);
      cookies().set(ACCESS_TOKEN_COOKIE_NAME, response.access_token, {
        maxAge: ACCESS_TOKEN_EXP,
        httpOnly: true,
        secure: true,
      });
      cookies().set(REFRESH_TOKEN_COOKIE_NAME, response.refresh_token, {
        maxAge: REFRESH_TOKEN_EXP,
        httpOnly: true,
        secure: true,
      });
      cookies().set(
        USER_PERMISSIONS_COOKIE_NAME,
        btoa(JSON.stringify(response.permissions)),
        {
          maxAge: REFRESH_TOKEN_EXP,
        },
      );
      return {
        success: true,
      };
    } catch (e) {
      if (e instanceof DALDriverError && e.response?.data.errors) {
        return {
          success: false,
          errorMessages: [e.response?.data.errors.identity],
        };
      }
    }
  }
  return {
    success: false,
    errorMessages: [
      " ایمیل یا نام کاربری یا کلمه عبورتان را اشتباه وارد کرده اید",
    ],
  };
}
