"use client";

import {useState} from "react";
import clsx from "clsx";
import {
  Text,
  Group,
  Box,
  Paper,
  Button,
  Tooltip,
  Skeleton,
} from "@mantine/core";
import {IconCornerUpLeft, IconX} from "@tabler/icons-react";
import {UserAvatar} from "@/components/user-avatar";
import {CommentForm} from "./comment-form";
import {OrphanCommentIndicator} from "./orphan-comment-indicator";
import {useIsClient} from "@/hooks/use-is-client";
import {useInit} from "@/hooks/data/init";
import {useTranslations} from "@/i18n/provider";
import {EditContentButton} from "@/components/edit-content-button";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";
import {formatDate} from "@/lib/date-and-time";
import {type Comment as CommentType} from "../../types/comment";
import classes from "./comment.module.css";

type Props = {
  // This objectUUID is related to the article that the comment will be linked to
  objectUUID: string;
  // The article's language code — replies belong to the same translation.
  languageCode: string;
  comment: CommentType;
  comments: CommentType[];
  level?: number;
  isOrphan?: boolean;
};

export function Comment({
  objectUUID,
  languageCode,
  isOrphan = false,
  comment,
  comments,
  level = 0,
}: Props) {
  const t = useTranslations();
  const isClient = useIsClient();
  const {data, isLoading} = useInit();
  const isLoggedIn = data?.status === "authenticated";
  const [isReplying, setIsReplying] = useState(false);
  const {uuid, author, body, created_at} = comment;
  const {name, avatar, uuid: authorUUID} = author;
  const replies = comments.filter((c) => c.parent_uuid === uuid);

  return (
    <Paper
      mb="xs"
      className={clsx({
        [classes.comment]: true,
        [classes.rootComment]: level === 0,
        [classes.nestedComment]: level > 0,
      })}
      pb={isLoggedIn ? 0 : "sm"}
    >
      <Group align="flex-start">
        <UserAvatar src={avatar} userId={authorUUID} />
        <div className={classes.commentContent}>
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {name}
            </Text>
            {isOrphan && <OrphanCommentIndicator />}
          </Group>
          <Text size="xs" c="dimmed">
            {formatDate(created_at, languageCode)}
          </Text>
          <Text mt="xs">{body}</Text>
          <Group gap={4} mt="xs" className={classes.actions} wrap="nowrap">
            {uuid && (
              <EditContentButton
                href={APP_PATHS.dashboard.comments.edit(uuid)}
                permission={PERMISSIONS.comments.UPDATE}
              />
            )}
            {isLoading || !isClient ? (
              <Skeleton w={30} h={25} />
            ) : isLoggedIn ? (
              <Tooltip label={t("comments.form.reply")} withArrow>
                <Button
                  className={classes.replyButton}
                  variant="transparent"
                  c="dimmed"
                  size="xs"
                  onClick={() => {
                    setIsReplying(!isReplying);
                  }}
                >
                  {isReplying ? (
                    <IconX size={25} />
                  ) : (
                    <IconCornerUpLeft size={25} />
                  )}
                </Button>
              </Tooltip>
            ) : null}
          </Group>
        </div>
      </Group>
      {isReplying && (
        <Box mt={"xs"}>
          <CommentForm
            objectUUID={objectUUID}
            parentUUID={uuid ?? null}
            languageCode={languageCode}
          />
        </Box>
      )}
      {replies && (
        <div style={{marginTop: 10}}>
          {replies.map((reply, index) => (
            <Comment
              key={index}
              objectUUID={objectUUID}
              languageCode={languageCode}
              comment={reply}
              comments={comments}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </Paper>
  );
}
