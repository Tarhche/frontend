import {SCOPE_PARAM, type DashboardScope} from "@/lib/dashboard-scope/shared";

export const APP_PATHS = {
  home: "/",
  articles: {
    index: "/articles",
    detail: (correlationUuid: string) => `/articles/${correlationUuid}`,
  },
  notes: {
    detail: (correlationUuid: string) => `/notes/${correlationUuid}`,
  },
  // `identity` is an author's `@username` or uuid — see `getAuthorIdentity`.
  // Left unencoded so these match the hrefs already rendered across the site;
  // both forms only ever contain URL-safe characters.
  //
  // An author has one page; `tab` selects which of its two lists to show.
  authors: {
    detail: (identity: string) => `/authors/${identity}`,
    tab: (identity: string, type: "article" | "note") =>
      type === "note"
        ? `/authors/${identity}?tab=note`
        : `/authors/${identity}`,
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    verify: "/auth/verify",
    resetPassword: "/auth/reset-password",
    frogotPassword: "/auth/forgot-password",
  },
  hashtags: {
    index: "/hashtags",
  },
  dashboard: {
    index: "/dashboard",
    articles: {
      index: "/dashboard/articles",
      new: "/dashboard/articles/new",
      edit: (correlationUuid: string, languageCode: string) =>
        `/dashboard/articles/${correlationUuid}/${languageCode}`,
    },
    // Notes and comments each have one listing page holding both scopes;
    // `list(scope)` selects the tab, while `index` stays a bare path for
    // `revalidatePath`, which ignores a query string. Creating and editing stay
    // on separate routes per scope, because each scope talks to its own API.
    notes: {
      index: "/dashboard/notes",
      list: (scope: DashboardScope = "all") =>
        scope === "own"
          ? `/dashboard/notes?${SCOPE_PARAM}=own`
          : "/dashboard/notes",
      new: "/dashboard/notes/new",
      edit: (correlationUuid: string, languageCode: string) =>
        `/dashboard/notes/${correlationUuid}/${languageCode}`,
    },
    comments: {
      index: "/dashboard/comments",
      list: (scope: DashboardScope = "all") =>
        scope === "own"
          ? `/dashboard/comments?${SCOPE_PARAM}=own`
          : "/dashboard/comments",
      edit: (uuid: string) => `/dashboard/comments/${uuid}`,
    },
    my: {
      bookmarks: "/dashboard/my/bookmarks",
      notes: {
        new: "/dashboard/my/notes/new",
        edit: (correlationUuid: string, languageCode: string) =>
          `/dashboard/my/notes/${correlationUuid}/${languageCode}`,
      },
    },
    users: {
      index: "/dashboard/users",
      new: "/dashboard/users/new",
      edit: (uuid: string) => `/dashboard/users/${uuid}`,
      editPassword: (uuid: string) => `/dashboard/users/${uuid}/edit-password`,
    },
    roles: {
      index: "/dashboard/roles",
      new: "/dashboard/roles/new",
      edit: (uuid: string) => `/dashboard/roles/${uuid}`,
    },
    languages: {
      index: "/dashboard/languages",
      new: "/dashboard/languages/new",
      edit: (code: string) => `/dashboard/languages/${code}`,
    },
    files: "/dashboard/files",
    settings: "/dashboard/settings",
    profile: {
      index: "/dashboard/profile",
      editPassword: "/dashboard/profile/password",
    },
    elements: {
      index: "/dashboard/elements",
      new: "/dashboard/elements/new",
      edit: (uuid: string) => `/dashboard/elements/${uuid}`,
    },
  },
};
