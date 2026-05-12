import {Group, Text} from "@mantine/core";
import {UserAvatar} from "@/components/user-avatar";
import {type Author} from "../types";

type Props = {
  author?: Partial<Author> | null;
  size?: number;
};

export function AuthorInline({author, size = 40}: Props) {
  if (!author?.uuid) {
    return null;
  }

  const name = author.name || author.username || "نویسنده";

  return (
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
  );
}
