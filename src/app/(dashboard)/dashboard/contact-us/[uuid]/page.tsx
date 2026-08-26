import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {ContactMessageDetail} from "@/features/contact/components/message-detail";
import {fetchContactMessage} from "@/dal/private/contact";
import {withPermissions} from "@/components/with-authorization";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();

  return {
    title: t("contactUs.dashboard.detailTitle"),
  };
}

type Props = {
  params: Promise<{
    uuid?: string;
  }>;
};

async function ContactMessagePage({params}: Props) {
  const {uuid} = await params;

  if (uuid === undefined) {
    notFound();
  }

  const message = await fetchContactMessage(uuid);

  return <ContactMessageDetail message={message} />;
}

export default withPermissions(ContactMessagePage, {
  requiredPermissions: ["contactus.show"],
});
