import {cookies} from "next/headers";
import {permanentRedirect} from "next/navigation";
import {Container} from "@mantine/core";
import {ACCESS_TOKEN_COOKIE_NAME, LANGUAGE_COOKIE_NAME} from "@/constants";
import {resolvePreferredLanguageCode} from "@/lib/language/resolve";
import {FeaturedArticlesSkeleton} from "@/features/home-page/components/featured-articles";

export default async function RootPage() {
  const cookieStore = await cookies();

  const target = await resolvePreferredLanguageCode({
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    cookieLanguage: cookieStore.get(LANGUAGE_COOKIE_NAME)?.value,
  });

  if (target) {
    permanentRedirect(`/${target}`);
  }

  return (
    <Container size="lg" mt="md">
      <FeaturedArticlesSkeleton />
    </Container>
  );
}
