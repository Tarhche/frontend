"use server";

import {revalidatePath} from "next/cache";
import * as z from "zod";
import {APP_PATHS} from "@/lib/app-paths";
import {bookmarkArticle} from "@/dal/private/bookmarks";

type FormState = {
  success: boolean;
  bookmarked: boolean;
  errorMessage?: string;
};

const SCHEMA = z.object({
  title: z.string(),
  correlation_uuid: z.string().uuid(),
  language_code: z.string().min(1),
});

export async function bookmark(
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
    await bookmarkArticle({
      keep: !isBookmarked,
      correlationUUID: validatedData.data.correlation_uuid,
      title: validatedData.data.title,
      language_code: validatedData.data.language_code,
    });
    revalidatePath(APP_PATHS.dashboard.my.bookmarks);
    return {
      success: true,
      bookmarked: !isBookmarked,
    };
  } catch {
    return {
      success: false,
      bookmarked: isBookmarked,
    };
  }
}
