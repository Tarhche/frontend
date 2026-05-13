"use server";

import {registerUser as signUpUser} from "@/dal/public/auth";
import {
  captureFormValues,
  extractValidationErrors,
  type FormValues,
  type ValidationErrorMap,
} from "@/lib/api/validation-errors";

type SuccessRegisterState = {
  success: true;
};

type FailureRegisterState = {
  success: false;
  values?: FormValues;
  errors?: ValidationErrorMap;
};

type UntouchedState = {
  success: undefined;
};

type State = SuccessRegisterState | FailureRegisterState | UntouchedState;

export async function registerUser(
  state: State,
  formData: FormData,
): Promise<State> {
  const email = formData.get("identity")?.toString() ?? "";
  const values = captureFormValues(formData);

  try {
    await signUpUser(email);
    return {success: true};
  } catch (e) {
    const errors = extractValidationErrors(e);
    return {
      success: false,
      values,
      ...(errors ? {errors} : {}),
    };
  }
}
