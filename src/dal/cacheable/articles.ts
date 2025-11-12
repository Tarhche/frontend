import {cacheableDalDriver} from "./cacheable-dal-driver";

export async function fetchArticleByUUID(uuid: string) {
  'use cache'
  
  const article = await cacheableDalDriver.get(`articles/${uuid}`);
  return article.data;
}
