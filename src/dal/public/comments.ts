import {publicDalDriver} from "./public-dal-driver";

export async function fetchArticleComments(articleUUID: string) {
  const article = await publicDalDriver.get("comments", {
    params: {
      object_type: "article",
      object_uuid: articleUUID,
    },
  });
  return article.data;
}
