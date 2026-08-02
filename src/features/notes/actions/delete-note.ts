"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {
  deleteNote as deleteNoteRequest,
  type NotesScope,
} from "@/dal/private/notes";

export async function deleteNote(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const correlationUuid = formData.get("correlation_uuid")?.toString();
  const languageCode = formData.get("language_code")?.toString();
  const scope: NotesScope =
    formData.get("scope")?.toString() === "own" ? "own" : "all";
  if (!correlationUuid || !languageCode) {
    return false;
  }

  try {
    await deleteNoteRequest(scope, correlationUuid, languageCode);
    // Both scopes are listed on the one path, so revalidating it covers the
    // own-scope tab too.
    revalidatePath(APP_PATHS.dashboard.notes.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
