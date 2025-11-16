"use server";

import {revalidatePath} from "next/cache";
import {APP_PATHS} from "@/lib/app-paths";
import {addNewFile, deleteFile} from "@/dal/private/files";

export async function addFileAction(formData: FormData): Promise<any> {
  await addNewFile(formData);
}

export async function deleteFileAction(formData: FormData) {
  const fileId = formData.get("id")?.toString();
  if (fileId === undefined) {
    return;
  }
  await deleteFile(fileId);
  revalidatePath(APP_PATHS.dashboard.files);
}

