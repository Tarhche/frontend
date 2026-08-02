import {APP_PATHS} from "@/lib/app-paths";

export type Author = {
  uuid: string;
  name: string;
  avatar: string;
  username: string;
};

export type AuthorWithCreatedAt = Author & {
  created_at: string;
};

// The path segment identifying an author: their username where they have one
// (prefixed with `@`, which the backend strips), otherwise their uuid.
export function getAuthorIdentity(author: Pick<Author, "uuid" | "username">) {
  if (author.username) {
    return `@${author.username}`;
  }
  return author.uuid;
}

export function getAuthorHref(author: Pick<Author, "uuid" | "username">) {
  return APP_PATHS.authors.detail(getAuthorIdentity(author));
}

// Which of an author page's two tabs to show. The author page is a single
// route; the tab travels in `?tab`.
export type AuthorContentType = "article" | "note";

// Anything other than the two known tabs falls back to articles, so a
// hand-edited query string can't break the page.
export function resolveAuthorTab(tab?: string): AuthorContentType {
  return tab === "note" ? "note" : "article";
}
