"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createLanguage, updateLanguage} from "@/dal/private/languages";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function upsertLanguageAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const isUpdating = formData.get("isUpdating")?.toString() === "true";

  try {
    const values = {
      code: formData.get("code")?.toString() || null,
      name: formData.get("name")?.toString() || null,
    };

    if (isUpdating) {
      await updateLanguage(values);
    } else {
      await createLanguage(values);
    }
  } catch (error) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  revalidatePath(APP_PATHS.dashboard.languages.index);
  redirect(APP_PATHS.dashboard.languages.index);
}
