import {type Metadata} from "next";
import {Container} from "@mantine/core";
import {ContactForm} from "@/features/contact/components/contact-form";
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
    title: t("contactUs.form.title"),
    description: t("contactUs.form.description"),
  };
}

async function ContactUsPage() {
  return (
    // Same measure as the article detail page, so a text-heavy page reads at one
    // consistent width across the public site.
    <Container
      component="section"
      px={{base: "0", sm: "md"}}
      size="sm"
      mt="xl"
      mb="xl"
    >
      <ContactForm />
    </Container>
  );
}

export default ContactUsPage;
