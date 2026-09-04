import {ExtractStrings} from "@/types/extractors";

type Action = "CREATE" | "DELETE" | "INDEX" | "SHOW" | "UPDATE";

type Permission = Partial<{
  [P in Action | (string & {})]: string | Permission;
}>;

type PermissionsSchema = {
  [P in string]: Permission;
};

export const PERMISSIONS = {
  articles: {
    CREATE: "articles.create",
    DELETE: "articles.delete",
    INDEX: "articles.index",
    SHOW: "articles.show",
    UPDATE: "articles.update",
  },
  comments: {
    CREATE: "comments.create",
    DELETE: "comments.delete",
    INDEX: "comments.index",
    SHOW: "comments.show",
    UPDATE: "comments.update",
  },
  config: {
    SHOW: "config.show",
    UPDATE: "config.update",
  },
  contactus: {
    DELETE: "contactus.delete",
    INDEX: "contactus.index",
    SHOW: "contactus.show",
    MARK_AS_READ: "contactus.markAsRead",
  },
  elements: {
    CREATE: "elements.create",
    DELETE: "elements.delete",
    INDEX: "elements.index",
    SHOW: "elements.show",
    UPDATE: "elements.update",
  },
  files: {
    CREATE: "files.create",
    DELETE: "files.delete",
    INDEX: "files.index",
    SHOW: "files.show",
  },
  languages: {
    CREATE: "languages.create",
    DELETE: "languages.delete",
    INDEX: "languages.index",
    SHOW: "languages.show",
    UPDATE: "languages.update",
  },
  permissions: {
    INDEX: "permissions.index",
  },
  runner: {
    containers: {
      CREATE: "runner.containers.create",
      DELETE: "runner.containers.delete",
      INDEX: "runner.containers.index",
      SHOW: "runner.containers.show",
      LOGS: "runner.containers.logs",
      MANAGE: "runner.containers.manage",
      ATTACH: "runner.containers.attach",
    },
    stacks: {
      CREATE: "runner.stacks.create",
      DELETE: "runner.stacks.delete",
      INDEX: "runner.stacks.index",
      SHOW: "runner.stacks.show",
      MANAGE: "runner.stacks.manage",
    },
  },
  roles: {
    CREATE: "roles.create",
    DELETE: "roles.delete",
    INDEX: "roles.index",
    SHOW: "roles.show",
    UPDATE: "roles.update",
  },
  self: {
    bookmarks: {
      DELETE: "self.bookmarks.delete",
      INDEX: "self.bookmarks.index",
    },
    comments: {
      DELETE: "self.comments.delete",
      INDEX: "self.comments.index",
      SHOW: "self.comments.show",
      UPDATE: "self.comments.update",
    },
    files: {
      DELETE: "self.files.delete",
      INDEX: "self.files.index",
    },
    runner: {
      containers: {
        INDEX: "self.runner.containers.index",
        SHOW: "self.runner.containers.show",
        LOGS: "self.runner.containers.logs",
        MANAGE: "self.runner.containers.manage",
        ATTACH: "self.runner.containers.attach",
        DELETE: "self.runner.containers.delete",
      },
      stacks: {
        INDEX: "self.runner.stacks.index",
        SHOW: "self.runner.stacks.show",
        MANAGE: "self.runner.stacks.manage",
        DELETE: "self.runner.stacks.delete",
      },
    },
  },
  users: {
    CREATE: "users.create",
    DELETE: "users.delete",
    INDEX: "users.index",
    SHOW: "users.show",
    UPDATE: "users.update",
    password: {
      UPDATE: "users.password.update",
    },
  },
} as const satisfies PermissionsSchema;

type PermissionsType = typeof PERMISSIONS;

export type Permissions = ExtractStrings<PermissionsType>;
