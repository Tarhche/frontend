import {type Metadata} from "next";
import {notFound} from "next/navigation";
import {EditCommentForm} from "@/features/comments/components/edit-comment-form";
import {fetchUsersDetailComments} from "@/dal/private/comments";
import {withPermissions} from "@/components/with-authorization";
import {getServerDictionary} from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const {t} = await getServerDictionary();

  return {
    title: t("comments.dashboard.editTitle"),
  };
}

type Props = {
  params: Promise<{
    uuid?: string;
  }>;
};

async function ArticleDetalPage({params}: Props) {
  const {uuid} = await params;

  if (uuid === undefined) {
    notFound();
  }

  const comment = await fetchUsersDetailComments(uuid);

  return (
    <EditCommentForm
      id={comment.uuid}
      parentId={comment.parent_uuid}
      objectId={comment.object_uuid}
      message={comment.body}
      approvalDate={comment.approved_at}
    />
  );
}

export default withPermissions(ArticleDetalPage, {
  requiredPermissions: ["comments.show", "comments.update"],
  operator: "AND",
});
