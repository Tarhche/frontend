import {notFound} from "next/navigation";
import {LanguagesUpsertForm} from "@/features/languages/components";
import {fetchLanguage} from "@/dal/private/languages";
import {withPermissions} from "@/components/with-authorization";

type Props = {
  params: Promise<{
    code?: string;
  }>;
};

async function UpdateLanguagePage({params}: Props) {
  const code = (await params).code;
  if (code === undefined) {
    notFound();
  }

  const language = await fetchLanguage(code);

  return (
    <LanguagesUpsertForm
      defaultValues={{
        code: language.code,
        name: language.name,
      }}
    />
  );
}

export default withPermissions(UpdateLanguagePage, {
  requiredPermissions: ["languages.show", "languages.update"],
  operator: "AND",
});
