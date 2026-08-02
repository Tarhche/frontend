"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import * as z from "zod";
import {APP_PATHS} from "@/lib/app-paths";
import {saveBookmark} from "@/dal/private/bookmarks";

type FormState = {
  success: boolean;
  bookmarked: boolean;
  errorMessage?: string;
};

const SCHEMA = z.object({
  title: z.string(),
  object_type: z.enum(["article", "note"]),
  correlation_uuid: z.string().uuid(),
  language_code: z.string().min(1),
});

export async function saveBookmarkAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const data: Record<string, any> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  const isBookmarked = formState.bookmarked;
  const validatedData = await SCHEMA.safeParseAsync(data);

  try {
    if (validatedData.success === false) {
      throw new Error();
    }
    await saveBookmark({
      keep: !isBookmarked,
      objectType: validatedData.data.object_type,
      correlationUUID: validatedData.data.correlation_uuid,
      title: validatedData.data.title,
      language_code: validatedData.data.language_code,
    });
    revalidatePath(APP_PATHS.dashboard.my.bookmarks);
    return {
      success: true,
      bookmarked: !isBookmarked,
    };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      bookmarked: isBookmarked,
    };
  }
}
