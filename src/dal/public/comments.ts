import {publicDalDriver} from "./public-dal-driver";

// Comments belong to the article group (correlation_uuid) within a language, so
// both the correlation uuid and the language code are required by the backend.
export async function fetchArticleComments(
  correlationUUID: string,
  languageCode: string,
) {
  const article = await publicDalDriver.get("comments", {
    params: {
      object_type: "article",
      object_uuid: correlationUUID,
      language_code: languageCode,
    },
  });
  return article.data;
}
