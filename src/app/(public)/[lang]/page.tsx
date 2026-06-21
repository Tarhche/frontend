import {type Metadata} from "next";
import {FeaturedArticles} from "@/features/home-page/components/featured-articles";
import {fetchHomePageData} from "@/dal/public/home";
import {NoContent} from "@/components/no-content";
import Element from "@/features/elements/element";
import {LANGUAGE_CODE_HEADER} from "@/constants";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  params: Promise<{
    lang: string;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);
  return {
    title: t("home.title"),
  };
}

export default async function HomePage(props: Props) {
  const {lang} = await props.params;
  const homePageData = await fetchHomePageData({
    headers: {[LANGUAGE_CODE_HEADER]: lang},
  });

  const hasContent =
    (homePageData.all?.length ?? 0) > 0 ||
    (homePageData.popular?.length ?? 0) > 0;

  if (!hasContent) {
    return <NoContent />;
  }

  return (
    <>
      <Element
        style={{marginTop: "1rem"}}
        type={"jumbotron"}
        elements={homePageData.elements}
      />
      <Element
        style={{marginTop: "1rem"}}
        type={"featured"}
        elements={homePageData.elements}
      />
      <FeaturedArticles
        latestArticles={homePageData.all}
        popularArticles={homePageData.popular}
      />

      <Element
        style={{marginTop: "1rem"}}
        type="cards"
        elements={homePageData.elements}
      />
    </>
  );
}
