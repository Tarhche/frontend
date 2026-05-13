"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {updatePassword} from "@/dal/private/users";
import {APP_PATHS} from "@/lib/app-paths";
import {
  extractValidationErrors,
  type ValidationFormState,
} from "@/lib/api/validation-errors";

type FormState = ValidationFormState;

export async function updateUserPasswordAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = formData.get("userId")?.toString() ?? "";
  const password = formData.get("new_password")?.toString() ?? "";
  const repassword = formData.get("repassword")?.toString() ?? "";
  if (password !== repassword) {
    return {
      success: false,
      errors: {
        repassword: "کلمه های عبور مطابقت ندارند",
      },
    };
  }
  try {
    await updatePassword({
      new_password: password,
      uuid: userId,
    });
  } catch (err) {
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors};
    }
    return {success: false};
  }
  revalidatePath(APP_PATHS.dashboard.users.edit(userId));
  redirect(APP_PATHS.dashboard.users.edit(userId));
}
