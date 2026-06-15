import {Title} from "@mantine/core";
import {getServerDictionary} from "@/i18n/server";

async function DashboardPage() {
  const {t} = await getServerDictionary();

  return (
    <div>
      <Title>{t("nav.dashboard")}</Title>
    </div>
  );
}

export default DashboardPage;
