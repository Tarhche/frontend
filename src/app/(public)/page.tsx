import {type Metadata} from "next";
import {
  FeaturedArticles,
} from "@/features/home-page/components/featured-articles";
import {fetchHomePageData} from "@/dal/public/home";
import Element from "@/features/elements/element";

export const metadata: Metadata = {
  title: "خانه",
};

export default async function HomePage() {
  const homePageData = await fetchHomePageData();

  return (
    <>
      <Element style={{ marginTop: '1rem' }} type={'jumbotron'} elements={homePageData.elements} />
      <Element style={{ marginTop: '1rem' }} type={'featured'} elements={homePageData.elements} />
      <FeaturedArticles latestArticles={homePageData.all} popularArticles={homePageData.popular} />
    </>
  );
}
