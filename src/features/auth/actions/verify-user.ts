"use server";

import {verifyUser as completeUserProfile} from "@/dal/public/auth";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState | undefined;

const PASSWORD_FIELDS = ["password", "repassword"] as const;

export async function verifyUser(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const data = captureFormValues(formData);
  const values = captureFormValues(formData, {exclude: PASSWORD_FIELDS});
  try {
    await completeUserProfile(data);
    return {success: true, values};
  } catch (error) {
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors, values};
    }
    return {success: false, values};
  }
}
