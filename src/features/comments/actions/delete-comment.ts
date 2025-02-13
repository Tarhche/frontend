"use server";
import {revalidatePath} from "next/cache";
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
  } catch {
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
    revalidatePath(APP_PATHS.dashboard.my.comments);
    return true;
  } catch {
    return false;
  }
}
