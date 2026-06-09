"use server";

import {fetchArticle} from "@/dal/private/articles";

// Resolves the correlation uuid (translation group id) of an existing article,
// so the article being edited can join the same translation group. Falls back to
// the article's own uuid when it isn't part of a group yet.
export async function getArticleCorrelationUuid(
  uuid: string,
): Promise<{correlationUuid: string; title: string} | null> {
  try {
    const article = await fetchArticle(uuid);
    const correlationUuid = article?.correlation_id || article?.uuid;
    if (!correlationUuid) {
      return null;
    }
    return {correlationUuid, title: article?.title ?? ""};
  } catch {
    return null;
  }
}
