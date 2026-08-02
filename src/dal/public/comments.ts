import {LANGUAGE_CODE_HEADER} from "@/constants";
import {type CommentObjectType} from "@/features/comments/types";
import {publicDalDriver} from "./public-dal-driver";

// Comments belong to a content group (correlation_uuid) within a language, so
// the correlation uuid is sent as the object identifier and the language code as
// the `X-Language-Code` header the backend resolves the request language from.
// `objectType` says which kind of content the group is — an article or a note.
export async function fetchComments(
  objectType: CommentObjectType,
  correlationUUID: string,
  languageCode: string,
) {
  const response = await publicDalDriver.get("comments", {
    params: {
      object_type: objectType,
      object_uuid: correlationUUID,
    },
    headers: {[LANGUAGE_CODE_HEADER]: languageCode},
  });
  return response.data;
}
