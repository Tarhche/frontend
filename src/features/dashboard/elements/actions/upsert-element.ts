"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createElement, updateElement} from "@/dal/private/elements";
import {APP_PATHS} from "@/lib/app-paths";
import {FormDataCodec} from "@/lib/form-data-codec";
import {
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function upsertElementAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string | string[]> =
    FormDataCodec.toObject(formData);

  try {
    if (formData.get("is_update")) {
      await updateElement(JSON.parse(values.jsonValue as string));
    } else {
      await createElement(JSON.parse(values.jsonValue as string));
    }
  } catch (err) {
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors};
    }
    return {success: false};
  }

  revalidatePath(APP_PATHS.dashboard.elements.index);
  if (values.uuid) {
    revalidatePath(APP_PATHS.dashboard.elements.edit(values.uuid as string));
  }
  redirect(APP_PATHS.dashboard.elements.index);
}
