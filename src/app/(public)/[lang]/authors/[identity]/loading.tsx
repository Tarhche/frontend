import {Container, Group, Paper, Skeleton, Stack} from "@mantine/core";
import {VerticalArticleCardSkeleton} from "@/features/home-page/components/article-card-vertical";

export default function AuthorLoading() {
  return (
    <Container size="sm" mt={50}>
      <Paper p={"lg"} radius={"md"} withBorder>
        <Group align="center" wrap="nowrap" gap={"lg"}>
          <Skeleton circle width={96} height={96} />
          <Stack gap={6} style={{flex: 1}}>
            <Skeleton h={20} w={"40%"} />
            <Skeleton h={12} w={"25%"} />
            <Skeleton h={10} w={"30%"} />
          </Stack>
        </Group>
      </Paper>
      {/* The tab bar, so it doesn't pop in after the header. */}
      <Group gap="lg" mt="md" mb="lg">
        <Skeleton h={20} w={110} />
        <Skeleton h={20} w={110} />
      </Group>
      <Stack gap={"md"}>
        {[1, 2, 3].map((n) => (
          <VerticalArticleCardSkeleton key={n} />
        ))}
      </Stack>
    </Container>
  );
}
