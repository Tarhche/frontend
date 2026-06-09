import {publicDalDriver} from "./public-dal-driver";

export async function fetchAllArticlesByHashtag(
  hashtag: string,
  page: number,
  languageCode?: string,
) {
  const response = await publicDalDriver.get(`hashtags/${hashtag}`, {
    params: {
      page: page,
      ...(languageCode ? {language_code: languageCode} : {}),
    },
  });

  return response.data;
}
