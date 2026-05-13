"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createRole, updateRole} from "@/dal/private/roles";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function upsertRoleAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const roleId = formData.get("roleId")?.toString();

  try {
    const values: Record<string, string | string[] | null> = {
      name: formData.get("name")?.toString() || null,
      description: formData.get("description")?.toString() || null,
      permissions: formData.getAll("permissions").toString().split(",") || null,
      user_uuids: formData.get("user_uuids")?.toString().split(",") || null,
    };
    if (roleId === undefined) {
      await createRole(values);
    } else {
      values.uuid = formData.get("roleId")?.toString() || null;
      await updateRole(values);
    }
  } catch (error) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(error);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  revalidatePath(APP_PATHS.dashboard.roles.index);
  redirect(APP_PATHS.dashboard.roles.index);
}
