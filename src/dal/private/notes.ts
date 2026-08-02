import {AxiosRequestConfig} from "axios";
import {privateDalDriver} from "./private-dal-driver";

// The dashboard exposes notes under two prefixes: `dashboard/notes` lists and
// edits every author's notes (guarded by the global `notes.*` permissions),
// while `dashboard/my/notes` is the same API scoped to the caller's own notes
// (guarded by `self.notes.*`). `scope` picks between them.
export type NotesScope = "all" | "own";

function basePath(scope: NotesScope) {
  return scope === "own" ? "dashboard/my/notes" : "dashboard/notes";
}

export async function fetchAllNotes(
  scope: NotesScope,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(basePath(scope), config);
  return response.data;
}

export async function createNote(scope: NotesScope, data: any) {
  return await privateDalDriver.post(basePath(scope), data);
}

export async function updateNote(scope: NotesScope, data: any) {
  return await privateDalDriver.put(basePath(scope), data);
}

export async function deleteNote(
  scope: NotesScope,
  correlationUuid: string,
  languageCode: string,
) {
  return await privateDalDriver.delete(
    `${basePath(scope)}/${correlationUuid}/${languageCode}`,
  );
}

// Returns the note translation, or `null` when it doesn't exist yet (404). We
// tolerate the 404 here — instead of letting `ServerPublicInterceptor` send the
// caller to the not-found page — so the dashboard can offer to create the
// missing translation under the same correlation group.
export async function fetchNoteTranslation(
  scope: NotesScope,
  correlationUuid: string,
  languageCode: string,
  config?: AxiosRequestConfig,
) {
  const response = await privateDalDriver.get(
    `${basePath(scope)}/${correlationUuid}/${languageCode}`,
    {
      ...config,
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    },
  );
  if (response.status === 404) {
    return null;
  }
  return response.data;
}
