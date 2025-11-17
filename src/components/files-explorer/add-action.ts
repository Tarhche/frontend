"use client"

import { addNewFile } from "@/dal/private/files";

export async function addFileAction(formData: FormData): Promise<any> {
    return addNewFile(formData);
}
