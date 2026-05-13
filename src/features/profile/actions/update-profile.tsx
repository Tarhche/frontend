"use server";

import {revalidatePath} from "next/cache";
import {updateUserProfile} from "@/dal/private/profile";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type FormValues,
  type ValidationErrorMap,
} from "@/lib/api/validation-errors";

type FormState = {
  success: boolean | null;
  errors?: ValidationErrorMap;
  values?: FormValues;
};

export async function updateProfileAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.includes("$") === false && Boolean(value)) {
      values[key] = value.toString() || "";
    }
  });

  try {
    await updateUserProfile(values);
  } catch (err) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  revalidatePath(APP_PATHS.dashboard.profile.index);
  return {success: true};
}
