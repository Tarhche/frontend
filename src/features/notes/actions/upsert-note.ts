"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createNote, updateNote, type NotesScope} from "@/dal/private/notes";
import {APP_PATHS} from "@/lib/app-paths";
import {
  captureFormValues,
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function upsertNoteAction(
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

  // `mode` decides create (POST) vs update (PUT) and `scope` which dashboard
  // section the note belongs to; neither is part of the payload.
  const isUpdate = formData.get("mode")?.toString() === "update";
  const scope: NotesScope =
    formData.get("scope")?.toString() === "own" ? "own" : "all";
  delete values.mode;
  delete values.scope;

  const correlationUuid = formData.get("correlation_uuid")?.toString();
  const languageCode = formData.get("language_code")?.toString();

  try {
    if (isUpdate) {
      await updateNote(scope, values);
    } else {
      await createNote(scope, values);
    }
  } catch (err) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }

  const paths =
    scope === "own" ? APP_PATHS.dashboard.my.notes : APP_PATHS.dashboard.notes;

  // Both scopes are listed on the one path; the redirect carries the scope so
  // the author lands back on the tab they were working in.
  revalidatePath(APP_PATHS.dashboard.notes.index);
  if (correlationUuid && languageCode) {
    revalidatePath(paths.edit(correlationUuid, languageCode));
  }
  redirect(APP_PATHS.dashboard.notes.list(scope));
}
