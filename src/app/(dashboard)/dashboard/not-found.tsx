import {NotFound} from "@/components/not-found";
import {getServerDictionary} from "@/i18n/server";

async function NotFoundPage() {
  const {t} = await getServerDictionary();

  return (
    <NotFound
      anchorText={t("nav.dashboard")}
      title={t("dashboard.notFoundTitle")}
      anchorLink="/dashboard"
    />
  );
}

export default NotFoundPage;
