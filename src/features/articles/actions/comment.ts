"use server";

import {createArticleComment} from "@/dal/private/comments";
import {
  captureFormValues,
  extractValidationErrors,
  type FormValues,
  type ValidationErrorMap,
} from "@/lib/api/validation-errors";

type FormState = {
  success?: boolean;
  errors?: ValidationErrorMap;
  values?: FormValues;
};

export async function comment(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const objectUUID = formData.get("object-uuid")?.toString() ?? "";
  const parentUUID = formData.get("parent-uuid")?.toString() ?? "";
  const body = formData.get("body")?.toString() ?? "";

  try {
    await createArticleComment({
      object_uuid: objectUUID,
      parent_uuid: parentUUID,
      body: body,
    });
    return {success: true};
  } catch (err) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }
}
