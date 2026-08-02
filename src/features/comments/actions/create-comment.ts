"use server";

import {createComment} from "@/dal/private/comments";
import {
  captureFormValues,
  extractValidationErrors,
  type FormValues,
  type ValidationErrorMap,
} from "@/lib/api/validation-errors";
import {type CommentObjectType} from "../types";

type FormState = {
  success?: boolean;
  errors?: ValidationErrorMap;
  values?: FormValues;
};

export async function createCommentAction(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const objectType = formData.get("object-type")?.toString() ?? "";
  const objectUUID = formData.get("object-uuid")?.toString() ?? "";
  const parentUUID = formData.get("parent-uuid")?.toString() ?? "";
  const languageCode = formData.get("language-code")?.toString() ?? "";
  const body = formData.get("body")?.toString() ?? "";

  try {
    await createComment({
      object_type: objectType as CommentObjectType,
      object_uuid: objectUUID,
      parent_uuid: parentUUID,
      language_code: languageCode,
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
