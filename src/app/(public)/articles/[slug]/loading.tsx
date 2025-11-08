import {Container} from "@mantine/core";
import {ContentSkeleton} from "@/features/articles/components/article-detail";

function ArticleLoading() {
  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <ContentSkeleton />
    </Container>
  );
}

export default ArticleLoading;
