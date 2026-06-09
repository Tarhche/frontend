import {LanguagesUpsertForm} from "@/features/languages/components";
import {withPermissions} from "@/components/with-authorization";

function NewLanguagePage() {
  return <LanguagesUpsertForm />;
}

export default withPermissions(NewLanguagePage, {
  requiredPermissions: ["languages.create"],
});
