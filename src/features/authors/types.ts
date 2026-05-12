export type Author = {
  uuid: string;
  name: string;
  avatar: string;
  username: string;
};

export type AuthorWithCreatedAt = Author & {
  created_at: string;
};

export function getAuthorHref(author: Pick<Author, "uuid" | "username">) {
  if (author.username) {
    return `/author/@${author.username}/articles`;
  }
  return `/author/${author.uuid}/articles`;
}
