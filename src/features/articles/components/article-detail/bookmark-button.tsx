"use client";

import {useActionState} from "react";
import {Tooltip, Box, ActionIcon} from "@mantine/core";
import {IconBookmark, IconBookmarkFilled} from "@tabler/icons-react";
import {bookmark} from "../../actions/bookmark";
import classes from "./bookmark-button.module.css";

type Props = {
  correlationUUID: string;
  title: string;
  isBookmarked: boolean;
  languageCode: string;
};

export function BookmarkButton({
  correlationUUID,
  title,
  isBookmarked,
  languageCode,
}: Props) {
  const [state, dispatch, isPending] = useActionState(bookmark, {
    success: true,
    bookmarked: isBookmarked,
    errorMessage: "",
  });
  const bookmarked = state.bookmarked;

  return (
    <Box component="form" lh={0} action={dispatch}>
      <Tooltip
        label={bookmarked ? "حذف از بوکمارک ها" : "ذخیره کردن"}
        withArrow
      >
        <ActionIcon
          variant="transparent"
          color="dimmed"
          type={isPending ? "button" : "submit"}
          ml={-7}
          style={{
            cursor: isPending ? "progress" : "pointer",
          }}
        >
          {isPending ? (
            <IconBookmarkFilled className={classes.opacity50} />
          ) : bookmarked ? (
            <IconBookmarkFilled />
          ) : (
            <IconBookmark size={50} />
          )}
        </ActionIcon>
      </Tooltip>
      <input
        type="text"
        value={correlationUUID}
        name="correlation_uuid"
        readOnly
        hidden
      />
      <input type="text" value={title} name="title" readOnly hidden />
      <input
        type="text"
        value={languageCode}
        name="language_code"
        readOnly
        hidden
      />
    </Box>
  );
}
