"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createUser, updateUser} from "@/dal/private/users";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function upsertUserAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (key.includes("$") === false && Boolean(value)) {
      values[key] = value.toString();
    }
  });
  try {
    if (values.uuid === undefined) {
      await createUser(values);
    } else {
      await updateUser(values);
    }
  } catch (error) {
    const echoed = captureFormValues(formData, {exclude: ["password"]});
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }
  revalidatePath(APP_PATHS.dashboard.users.index);
  redirect(APP_PATHS.dashboard.users.index);
}
