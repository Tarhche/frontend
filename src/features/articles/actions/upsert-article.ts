"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createArticle, updateArticle} from "@/dal/private/articles";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function upsertArticleAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string | string[]> = {};
  formData.forEach((v, k) => {
    if (v) {
      values[k] = v.toString();
    }
  });

  values.tags =
    formData.get("tags")?.toString().split(",").filter(Boolean) ?? [];

  // `mode` decides create (POST) vs update (PUT); it isn't part of the payload.
  const isUpdate = formData.get("mode")?.toString() === "update";
  delete values.mode;

  const correlationUuid = formData.get("correlation_uuid")?.toString();
  const languageCode = formData.get("language_code")?.toString();

  try {
    if (isUpdate) {
      await updateArticle(values);
    } else {
      await createArticle(values);
    }
  } catch (err) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  revalidatePath(APP_PATHS.dashboard.articles.index);
  if (correlationUuid && languageCode) {
    revalidatePath(
      APP_PATHS.dashboard.articles.edit(correlationUuid, languageCode),
    );
  }
  redirect(APP_PATHS.dashboard.articles.index);
}
