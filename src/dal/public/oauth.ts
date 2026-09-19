import {publicDalDriver} from "./public-dal-driver";

// what an application is asking for, as the backend reads it back out of the
// signed request the authorization endpoint sent here. The page is handed that
// request in its url and can make nothing of it itself: what it shows has to
// come from the one place the signature is checked.
export type AuthorizationRequest = {
  client_id: string;
  client_name?: string;
  client_uri?: string;
  redirect_uri: string;
  scopes: string[];
};

export async function fetchAuthorizationRequest(
  request: string,
): Promise<AuthorizationRequest> {
  const response = await publicDalDriver.get("oauth/authorization", {
    params: {request},
  });

  return response.data;
}
