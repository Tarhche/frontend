"use server";

import {revalidatePath} from "next/cache";
import {updateConfigs} from "@/dal/private/config";
import {convertFormDataActionToObject} from "@/lib/transformers";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function updateSettingAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const data = convertFormDataActionToObject(formData);
    if (typeof data.user_default_roles === "string") {
      data.user_default_roles = data.user_default_roles.split(",");
    }
    await updateConfigs(data);
  } catch (error) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  revalidatePath(APP_PATHS.dashboard.settings);
  return {success: true};
}
