import ElementJumbotron from "@/features/elements/jumbotron/element-jumbotron";
import ElementFeatured from "@/features/elements/featured/element-featured";
import ElementCards from "./cards/element-cards";
import ElementStack from "./stack/element-stack";

const elementMap = {
  jumbotron: ElementJumbotron,
  featured: ElementFeatured,
  cards: ElementCards,
  stack: ElementStack,
};

export default elementMap;
