"use server";

import {loginUser} from "@/dal/public/auth";
import {
  rememberActiveSession,
  rememberSession,
  setActiveSession,
} from "@/lib/accounts";
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

    // signing in does not sign anybody out: whoever was here is written down
    // first, so both accounts are listed and either can be switched to.
    await rememberActiveSession();

    // the profile language becomes the in-use language, across both the public
    // pages and the dashboard.
    await setActiveSession(response);
    await rememberSession(response);

    return {success: true};
  } catch (e) {
    const errors = extractValidationErrors(e);
    if (errors) {
      return {success: false, errors, values};
    }

    return {success: false, values};
  }
}
