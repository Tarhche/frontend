import {publicDalDriver} from "./public-dal-driver";

export async function fetchAllArticlesByHashtag(hashtag: string, page: number) {
  const response = await publicDalDriver.get(`hashtags/${hashtag}`, {
    params: {
      page: page,
    },
  });

  return response.data;
}
