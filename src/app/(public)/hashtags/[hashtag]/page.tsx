import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {VerticalArticleCard} from "@/features/home-page/components/article-card-vertical";
import {fetchAllArticlesByHashtag} from "@/dal/public/hashtags";

type Props = {
  params: Promise<{
    hashtag?: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const hashtag = decodeURI(params.hashtag ?? "");
  return {
    title: `${hashtag} | تگ ها`,
  };
}

async function HashtagPage(props: Props) {
  const params = await props.params;
  const hashtag = params.hashtag;
  if (hashtag === undefined) {
    notFound();
  }
  const {items} = await fetchAllArticlesByHashtag(hashtag);

  const articles = items.map((article: any) => {
    return (
      <VerticalArticleCard
        key={article.uuid}
        article={{
          thumbnail: article.cover,
          title: article.title,
          subtitle: article.excerpt,
          publishedDate: article.published_at,
          slug: article.uuid,
          tags: [],
        }}
      />
    );
  });

  return (
    <>
      {articles}     
    </>
  );
}

export default HashtagPage;
