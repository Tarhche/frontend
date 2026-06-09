import {type Metadata} from "next";
import {FeaturedArticles} from "@/features/home-page/components/featured-articles";
import {fetchHomePageData} from "@/dal/public/home";
import Element from "@/features/elements/element";

export const metadata: Metadata = {
  title: "خانه",
};

type Props = {
  params: Promise<{
    lang: string;
  }>;
};

export default async function HomePage(props: Props) {
  const {lang} = await props.params;
  const homePageData = await fetchHomePageData({
    params: {language_code: lang},
  });

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
