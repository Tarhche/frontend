"use server";

import {unstable_rethrow} from "next/navigation";
import {answerAuthorizationRequest} from "@/dal/private/oauth";

export type AuthorizationFormState = {
  success: boolean;

  // redirectTo is the application's own address, which is where the browser
  // goes next whether the answer was yes or no.
  redirectTo?: string;
  failed?: boolean;
};

// answerAuthorization records what somebody decided about an application that
// asked to act for them.
//
// Who decided is not in this form: it is whoever the session sending it is
// for, which the backend reads off the request's own token. Nothing here can
// say otherwise.
export async function answerAuthorization(
  formState: AuthorizationFormState | undefined,
  formData: FormData,
): Promise<AuthorizationFormState> {
  const request = formData.get("request")?.toString() ?? "";
  const approved = formData.get("decision")?.toString() === "approve";

  try {
    const {redirect_to} = await answerAuthorizationRequest(request, approved);

    return {success: true, redirectTo: redirect_to};
  } catch (error) {
    unstable_rethrow(error);

    return {success: false, failed: true};
  }
}
