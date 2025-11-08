"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createElement, updateElement} from "@/dal/private/elements";
import {APP_PATHS} from "@/lib/app-paths";
import {FormDataCodec} from "@/lib/form-data-codec";
type FormState = {
  status: any;
  success?: boolean;
  fieldErrors?: {
    title?: string;
    excerpt?: string;
    body?: string;
  };
};

export async function upsertElementAction(
  formState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values: Record<string, string | string[]> =
    FormDataCodec.toObject(formData);

  try {
    if (formData.get("is_update")) {
      await updateElement(values);
    } else {
      await createElement(values);
    }
  } catch (err: any) {
    return {
      success: false,
      status: err.response?.status,
      fieldErrors: err.response?.data.errors ?? {},
    };
  }

  revalidatePath(APP_PATHS.dashboard.elements.index);
  if (values.uuid) {
    revalidatePath(APP_PATHS.dashboard.elements.edit(values.uuid as string));
  }
  redirect(APP_PATHS.dashboard.elements.index);
}
