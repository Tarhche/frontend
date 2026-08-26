"use server";

import {sendContactMessage} from "@/dal/public/contact";
import {
  captureFormValues,
  extractValidationErrors,
  type FormValues,
  type ValidationErrorMap,
} from "@/lib/api/validation-errors";

type FormState = {
  success?: boolean;
  errors?: ValidationErrorMap;
  values?: FormValues;
};

export async function sendContactMessageAction(
  state: FormState,
  formData: FormData,
): Promise<FormState> {
  const subject = formData.get("subject")?.toString() ?? "";
  const body = formData.get("body")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  const phone = formData.get("phone")?.toString() ?? "";

  try {
    await sendContactMessage({subject, body, email, phone});
    return {success: true};
  } catch (err) {
    const echoed = captureFormValues(formData);
    const errors = extractValidationErrors(err);
    if (errors) {
      return {success: false, errors, values: echoed};
    }
    return {success: false, values: echoed};
  }
}
