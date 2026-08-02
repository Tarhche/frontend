"use server";

import {revalidatePath} from "next/cache";
import {unstable_rethrow} from "next/navigation";
import {APP_PATHS} from "@/lib/app-paths";
import {deleteComment, deleteSelfComment} from "@/dal/private/comments";

export async function deleteCommentAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const commentId = formData.get("id")?.toString();
  if (commentId === undefined) {
    return false;
  }
  try {
    await deleteComment(commentId);
    revalidatePath(APP_PATHS.dashboard.comments.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}

export async function deleteSelfCommentAction(
  prevState: boolean,
  formData: FormData,
): Promise<boolean> {
  const commentId = formData.get("id")?.toString();
  if (commentId === undefined) {
    return false;
  }
  try {
    await deleteSelfComment(commentId);
    // Both scopes are listed on the one path, so revalidating it covers the
    // own-scope tab too.
    revalidatePath(APP_PATHS.dashboard.comments.index);
    return true;
  } catch (error) {
    unstable_rethrow(error);
    return false;
  }
}
