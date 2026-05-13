"use server";

import {resetPassword as changePassword} from "@/dal/public/auth";
import {
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState | null;

export async function resetPassword(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const newPassword = formData.get("password")?.toString();
  const confirmNewPassword = formData.get("confirm_password")?.toString();
  const token = formData.get("token")?.toString();

  if (newPassword !== confirmNewPassword) {
    return {
      success: false,
      errors: {
        confirm_password: "کلمه های عبور باید یکسان باشند.",
      },
    };
  }

  try {
    if (newPassword && token) {
      await changePassword(newPassword, token);
    } else {
      throw new Error();
    }
    return {success: true};
  } catch (error) {
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors};
    }
    return {success: false};
  }
}
