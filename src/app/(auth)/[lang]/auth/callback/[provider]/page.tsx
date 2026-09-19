import {type Metadata} from "next";
import {ProviderCallback} from "@/features/auth/components/provider-callback";
import {getDictionary} from "@/i18n/dictionary";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);

  return {
    title: t("auth.providers.metadataTitle"),
  };
}

type Props = {
  params: Promise<{provider: string}>;
  searchParams: Promise<{
    code?: string;
    state?: string;
    // a provider says so when somebody declines, or when it will not answer
    error?: string;
  }>;
};

// Where a provider sends the browser back to. It is a page rather than a route
// handler so that what happens next is an ordinary client navigation, and no
// url has to be built here by hand.
async function ProviderCallbackPage({params, searchParams}: Props) {
  const {provider} = await params;
  const {code, state, error} = await searchParams;

  return (
    <ProviderCallback
      provider={provider}
      code={code ?? ""}
      state={state ?? ""}
      refused={Boolean(error)}
    />
  );
}

export default ProviderCallbackPage;
