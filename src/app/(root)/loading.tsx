import {Container} from "@mantine/core";
import {FeaturedArticlesSkeleton} from "@/features/home-page/components/featured-articles";

export default function RootLoading() {
  return (
    <Container size="lg" mt="md">
      <FeaturedArticlesSkeleton />
    </Container>
  );
}
