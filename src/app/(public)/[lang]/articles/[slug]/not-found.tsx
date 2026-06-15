import {Container} from "@mantine/core";
import {NotFound} from "@/components/not-found";
import {getServerDictionary} from "@/i18n/server";

// Co-located not-found boundary for the article route. Without it, a notFound()
// thrown while the article's loading.tsx skeleton is streaming bubbles up past
// this segment and never replaces the skeleton (infinite loading). This happens
// e.g. when switching to a language the article has no translation for.
export default async function ArticleNotFound() {
  const {t} = await getServerDictionary();

  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <NotFound
        title={t("articles.detail.notFoundTitle")}
        text={t("articles.detail.notFoundText")}
      />
    </Container>
  );
}
