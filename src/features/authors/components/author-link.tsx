import Link from "@/components/link";
import {Group, Text} from "@mantine/core";
import {UserAvatar} from "@/components/user-avatar";
import {type Author, getAuthorHref} from "../types";

type Props = {
  author?: Partial<Author> | null;
  size?: number;
};

export function AuthorLink({author, size = 40}: Props) {
  if (!author?.uuid) {
    return null;
  }

  const name = author.name || author.username || "نویسنده";

  return (
    <Link
      href={getAuthorHref({uuid: author.uuid, username: author.username ?? ""})}
      style={{textDecoration: "none", color: "inherit", display: "inline-flex"}}
    >
      <Group gap={"sm"} wrap="nowrap">
        <UserAvatar
          src={author.avatar || undefined}
          userId={author.uuid}
          width={size}
          height={size}
        />
        <Text size="sm" fw={500}>
          {name}
        </Text>
      </Group>
    </Link>
  );
}
