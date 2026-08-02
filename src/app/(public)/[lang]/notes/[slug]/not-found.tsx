import {Container} from "@mantine/core";
import {NotFound} from "@/components/not-found";
import {getServerDictionary} from "@/i18n/server";

// Co-located not-found boundary for the note route. Without it, a notFound()
// thrown while the note's loading.tsx skeleton is streaming bubbles up past this
// segment and never replaces the skeleton (infinite loading). This happens e.g.
// when switching to a language the note has no translation for.
export default async function NoteNotFound() {
  const {t} = await getServerDictionary();

  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <NotFound
        title={t("notes.detail.notFoundTitle")}
        text={t("notes.detail.notFoundText")}
      />
    </Container>
  );
}
