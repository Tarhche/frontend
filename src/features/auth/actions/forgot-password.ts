"use server";

import {forgotPassword as recoverPassword} from "@/dal/public/auth";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState | undefined;

export async function forgotPassword(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const identity = formData.get("identity")?.toString();
  const values = captureFormValues(formData);
  try {
    if (identity === undefined) {
      throw new Error();
    }
    await recoverPassword(identity);

    return {success: true, values};
  } catch (error) {
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors, values};
    }
    return {success: false, values};
  }
}
