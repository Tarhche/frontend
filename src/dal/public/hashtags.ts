import {LANGUAGE_CODE_HEADER} from "@/constants";
import {publicDalDriver} from "./public-dal-driver";

// Which of a hashtag page's two tabs to list. Mirrors the backend's
// `getContentsByHashtag.Type*` constants.
export type HashtagContentType = "article" | "note";

// Returns one tab's worth of a hashtag's published content, paginated on that
// tab's own count. `type` is optional: the backend then picks articles, or notes
// when the hashtag has no articles, and echoes the choice back as `type`. The
// response also carries `totals` for both tabs so they can both be labelled.
export async function fetchContentsByHashtag(
  hashtag: string,
  page: number,
  type?: HashtagContentType,
  languageCode?: string,
) {
  const response = await publicDalDriver.get(`hashtags/${hashtag}`, {
    params: {
      page: page,
      ...(type ? {type} : {}),
    },
    headers: languageCode ? {[LANGUAGE_CODE_HEADER]: languageCode} : undefined,
  });

  return response.data;
}
