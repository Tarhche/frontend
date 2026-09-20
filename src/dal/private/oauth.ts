import {privateDalDriver} from "./private-dal-driver";

// where the browser goes once the question has been answered, which is the
// application's own address either way: it is told what it was given, or why
// it was not.
export type AuthorizationAnswer = {
  redirect_to: string;
};

export async function answerAuthorizationRequest(
  request: string,
  approved: boolean,
): Promise<AuthorizationAnswer> {
  const response = await privateDalDriver.post("oauth/authorization", {
    request,
    approved,
  });

  return response.data;
}
