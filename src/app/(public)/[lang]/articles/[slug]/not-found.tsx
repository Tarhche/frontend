import {Container} from "@mantine/core";
import {NotFound} from "@/components/not-found";

// Co-located not-found boundary for the article route. Without it, a notFound()
// thrown while the article's loading.tsx skeleton is streaming bubbles up past
// this segment and never replaces the skeleton (infinite loading). This happens
// e.g. when switching to a language the article has no translation for.
export default function ArticleNotFound() {
  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <NotFound
        title="مقاله یافت نشد"
        text="این مقاله در زبان انتخاب‌شده موجود نیست."
      />
    </Container>
  );
}
