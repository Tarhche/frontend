"use server";
import {DALDriverError} from "@/dal/dal-driver-error";
import {registerUser as signUpUser} from "@/dal/public/auth";

type SuccessRegisterState = {
  success: true;
  message: string;
  email : string;
};

type FailureRegisterState = {
  success: false;
  errorMessage: string;
  email : string;
};

type UntouchedState = {
  success: undefined;
  email : string;
};

type State = SuccessRegisterState | FailureRegisterState | UntouchedState;

export async function registerUser(
  state: State,
  formData: FormData,
): Promise<State> {
  const email = formData.get("email")?.toString();
  try {
    if (email === undefined) {
      throw new Error();
    }
    await signUpUser(email);
    return {
      success: true,
      message: "",
      email: email,
    };
  } catch (e) {
    if (e instanceof DALDriverError) {
      const errors = e.response?.data.errors;
      if (errors.identity) {
        return {
          success: false,
          errorMessage: errors.identity,
          email: email ?? "",
        };
      }
    }
  }
  return {
    success: false,
    errorMessage: "خطایی ناشناخته اتفاق افتاد لطفا دوباره تلاش نمایید",
    email: email ?? "",
  };
}
