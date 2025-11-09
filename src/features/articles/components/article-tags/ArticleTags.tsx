import React from "react";
import {Anchor, Group} from "@mantine/core";
import Link from "@/components/link";

function ArticleTags({tags}: {tags: string[]}) {
  return (
    <Group ms={"sm"} gap={"xs"}>
      {tags.map((tag) => {
        return (
          <Anchor key={tag} component={Link} href={`/hashtags/${tag}`}>
            #{tag}
          </Anchor>
        );
      })}
    </Group>
  );
}

export default ArticleTags;
