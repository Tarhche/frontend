"use server";

import {verifyUser as completeUserProfile} from "@/dal/public/auth";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

const PASSWORD_FIELDS = ["password", "repassword"] as const;

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
    const values = captureFormValues(formData, {exclude: PASSWORD_FIELDS});
    try {
      await completeUserProfile(data);
      return {success: true};
    } catch (e) {
      const errors = extractValidationErrors(e);
      if (errors) {
        return {success: false, errors, values};
      }
      return {success: false, values};
    }
  }

  return {success: false};
}
