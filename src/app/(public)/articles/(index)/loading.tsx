import {VerticalArticleCardSkeleton} from "@/features/home-page/components/article-card-vertical";

function ArticlesLoading() {
  return [1, 2, 3, 4].map((num) => {
    return <VerticalArticleCardSkeleton key={num} />;
  });
}

export default ArticlesLoading;
