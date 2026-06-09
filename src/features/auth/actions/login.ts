"use server";

import {cookies} from "next/headers";
import {loginUser} from "@/dal/public/auth";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/constants/strings";
import {ACCESS_TOKEN_EXP, REFRESH_TOKEN_EXP} from "@/constants/numbers";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState | null;

export async function login(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const identity = formData.get("identity")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const values = captureFormValues(formData, {exclude: ["password"]});

  try {
    const response = await loginUser(identity, password);

    (await cookies()).set(ACCESS_TOKEN_COOKIE_NAME, response.access_token, {
      maxAge: ACCESS_TOKEN_EXP,
      httpOnly: false,
      secure: true,
    });

    (await cookies()).set(REFRESH_TOKEN_COOKIE_NAME, response.refresh_token, {
      maxAge: REFRESH_TOKEN_EXP,
      httpOnly: false,
      secure: true,
    });

    return {success: true};
  } catch (e) {
    const errors = extractValidationErrors(e);
    if (errors) {
      return {success: false, errors, values};
    }

    return {success: false, values};
  }
}
