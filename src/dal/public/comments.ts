import {LANGUAGE_CODE_HEADER} from "@/constants";
import {publicDalDriver} from "./public-dal-driver";

// Comments belong to the article group (correlation_uuid) within a language, so
// the correlation uuid is sent as the object identifier and the language code as
// the `X-Language-Code` header the backend resolves the request language from.
export async function fetchArticleComments(
  correlationUUID: string,
  languageCode: string,
) {
  const article = await publicDalDriver.get("comments", {
    params: {
      object_type: "article",
      object_uuid: correlationUUID,
    },
    headers: {[LANGUAGE_CODE_HEADER]: languageCode},
  });
  return article.data;
}
