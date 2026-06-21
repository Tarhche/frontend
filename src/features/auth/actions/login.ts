"use server";

import {cookies} from "next/headers";
import {loginUser} from "@/dal/public/auth";
import {languageFromAccessToken} from "@/lib/language/resolve";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  LANGUAGE_COOKIE_NAME,
} from "@/constants/strings";
import {
  ACCESS_TOKEN_EXP,
  REFRESH_TOKEN_EXP,
  LANGUAGE_COOKIE_EXP,
} from "@/constants/numbers";
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

    // Make the user's profile language the in-use language across both the public
    // pages and the dashboard.
    const profileLanguage = languageFromAccessToken(response.access_token);
    if (profileLanguage) {
      (await cookies()).set(LANGUAGE_COOKIE_NAME, profileLanguage, {
        maxAge: LANGUAGE_COOKIE_EXP,
        path: "/",
      });
    }

    return {success: true};
  } catch (e) {
    const errors = extractValidationErrors(e);
    if (errors) {
      return {success: false, errors, values};
    }

    return {success: false, values};
  }
}
