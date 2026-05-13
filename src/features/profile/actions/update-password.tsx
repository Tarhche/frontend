"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {updateProfilePassword} from "@/dal/private/password";
import {APP_PATHS} from "@/lib/app-paths";
import {
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function updateProfilePasswordAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.includes("$") === false && value.toString()) {
      values[key] = value.toString();
    }
  });

  try {
    await updateProfilePassword(values);
  } catch (err) {
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors};
    }
    return {success: false};
  }

  revalidatePath(APP_PATHS.dashboard.profile.index);
  redirect(APP_PATHS.dashboard.profile.index);
}
