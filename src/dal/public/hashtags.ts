import {LANGUAGE_CODE_HEADER} from "@/constants";
import {publicDalDriver} from "./public-dal-driver";

export async function fetchAllArticlesByHashtag(
  hashtag: string,
  page: number,
  languageCode?: string,
) {
  const response = await publicDalDriver.get(`hashtags/${hashtag}`, {
    params: {
      page: page,
    },
    headers: languageCode ? {[LANGUAGE_CODE_HEADER]: languageCode} : undefined,
  });

  return response.data;
}
