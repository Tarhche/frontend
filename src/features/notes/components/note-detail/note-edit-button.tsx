"use client";

import {EditContentButton} from "@/components/edit-content-button";
import {useInit} from "@/hooks/data/init";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
// Imported from `shared` rather than `@/lib/auth`, whose barrel also pulls in the
// server-only token helpers.
import {hasPermission} from "@/lib/auth/shared";

type Props = {
  correlationUuid: string;
  languageCode: string;
  // Whose note this is, so an author holding only the self permission is sent
  // to the section that will actually let them in.
  authorUuid?: string;
};

// Notes are editable from two dashboard sections, so — unlike articles — the
// shortcut has to resolve which one the viewer may use: every note with
// `notes.update`, or just their own with `self.notes.update`.
export function NoteEditButton({
  correlationUuid,
  languageCode,
  authorUuid,
}: Props) {
  const {data} = useInit();

  if (data?.status !== "authenticated") {
    return null;
  }

  if (hasPermission(data.permissions, [PERMISSIONS.notes.UPDATE])) {
    return (
      <EditContentButton
        href={APP_PATHS.dashboard.notes.edit(correlationUuid, languageCode)}
        permission={PERMISSIONS.notes.UPDATE}
      />
    );
  }

  const isAuthor = Boolean(authorUuid) && data.profile?.uuid === authorUuid;

  if (
    isAuthor &&
    hasPermission(data.permissions, [PERMISSIONS.self.notes.UPDATE])
  ) {
    return (
      <EditContentButton
        href={APP_PATHS.dashboard.my.notes.edit(correlationUuid, languageCode)}
        permission={PERMISSIONS.self.notes.UPDATE}
      />
    );
  }

  return null;
}
