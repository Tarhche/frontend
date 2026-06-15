import Link from "@/components/link";
import {Box, Stack, Alert, Anchor} from "@mantine/core";
import {AuthGuard} from "@/components/auth-guard";
import {CommentForm} from "./comment-form";
import {Comment} from "./comment";
import {IconInfoCircle} from "@tabler/icons-react";
import {fetchArticleComments} from "@/dal/public/comments";
import {getDictionary} from "@/i18n/dictionary";

type Props = {
  correlationUUID: string;
  languageCode: string;
};

export async function Comments({correlationUUID, languageCode}: Props) {
  const {t} = getDictionary(languageCode);
  const comments = (await fetchArticleComments(correlationUUID, languageCode))
    .items;
  const rootComments = comments.filter((c) => c.parent_uuid === undefined);
  const validIds = new Set(comments.map((c) => c.uuid));
  const orphanComments = comments.filter((c) => {
    if (c.parent_uuid && validIds.has(c.parent_uuid) === false) {
      return true;
    }
    return false;
  });

  return (
    <>
      <AuthGuard
        fallback={
          <Alert
            mt={"md"}
            variant="light"
            color="yellow"
            title={t("comments.form.authRequiredTitle")}
            icon={<IconInfoCircle />}
          >
            {t("comments.form.authRequiredPrefix")}
            <Anchor underline="always" href={"/auth/login"} component={Link}>
              {t("comments.form.authRequiredLink")}
            </Anchor>
            {t("comments.form.authRequiredSuffix")}
          </Alert>
        }
      >
        <Box mt={"lg"}>
          <CommentForm
            objectUUID={correlationUUID}
            parentUUID={""}
            languageCode={languageCode}
          />
        </Box>
      </AuthGuard>
      <Stack mt={"xl"}>
        {rootComments.map((comment) => {
          return (
            <Comment
              objectUUID={correlationUUID}
              languageCode={languageCode}
              key={comment.uuid}
              comments={comments}
              comment={comment}
            />
          );
        })}
        {orphanComments.map((comment) => {
          return (
            <Comment
              objectUUID={correlationUUID}
              languageCode={languageCode}
              key={comment.uuid}
              comments={comments}
              comment={comment}
              isOrphan={true}
            />
          );
        })}
        {comments.length === 0 && (
          <Alert variant="light" color="green" icon={<IconInfoCircle />}>
            {t("comments.list.empty")}
          </Alert>
        )}
      </Stack>
    </>
  );
}
