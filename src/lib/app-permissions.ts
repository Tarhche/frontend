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
  workload: {
    tasks: {
      CREATE: "workload.tasks.create",
      DELETE: "workload.tasks.delete",
      INDEX: "workload.tasks.index",
      SHOW: "workload.tasks.show",
      LOGS: "workload.tasks.logs",
      MANAGE: "workload.tasks.manage",
      ATTACH: "workload.tasks.attach",
    },
    // MANAGE is starting, stopping, restarting and restoring one.
    vms: {
      CREATE: "workload.vms.create",
      DELETE: "workload.vms.delete",
      INDEX: "workload.vms.index",
      SHOW: "workload.vms.show",
      UPDATE: "workload.vms.update",
      MANAGE: "workload.vms.manage",
      LOGS: "workload.vms.logs",
      ATTACH: "workload.vms.attach",
    },
    snapshots: {
      CREATE: "workload.snapshots.create",
      DELETE: "workload.snapshots.delete",
      INDEX: "workload.snapshots.index",
      SHOW: "workload.snapshots.show",
      UPDATE: "workload.snapshots.update",
    },
    // these cover a Docker VM's images, networks and volumes as well as its
    // containers.
    containers: {
      CREATE: "workload.containers.create",
      DELETE: "workload.containers.delete",
      INDEX: "workload.containers.index",
      SHOW: "workload.containers.show",
      MANAGE: "workload.containers.manage",
      LOGS: "workload.containers.logs",
    },
    stacks: {
      CREATE: "workload.stacks.create",
      DELETE: "workload.stacks.delete",
      INDEX: "workload.stacks.index",
      SHOW: "workload.stacks.show",
      MANAGE: "workload.stacks.manage",
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
    articles: {
      INDEX: "self.articles.index",
      SHOW: "self.articles.show",
      UPDATE: "self.articles.update",
      DELETE: "self.articles.delete",
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
    workload: {
      tasks: {
        INDEX: "self.workload.tasks.index",
        SHOW: "self.workload.tasks.show",
        LOGS: "self.workload.tasks.logs",
        MANAGE: "self.workload.tasks.manage",
        ATTACH: "self.workload.tasks.attach",
        DELETE: "self.workload.tasks.delete",
      },
      vms: {
        INDEX: "self.workload.vms.index",
        SHOW: "self.workload.vms.show",
        UPDATE: "self.workload.vms.update",
        DELETE: "self.workload.vms.delete",
        MANAGE: "self.workload.vms.manage",
        LOGS: "self.workload.vms.logs",
        ATTACH: "self.workload.vms.attach",
      },
      snapshots: {
        INDEX: "self.workload.snapshots.index",
        SHOW: "self.workload.snapshots.show",
        UPDATE: "self.workload.snapshots.update",
        DELETE: "self.workload.snapshots.delete",
      },
      containers: {
        INDEX: "self.workload.containers.index",
        SHOW: "self.workload.containers.show",
        DELETE: "self.workload.containers.delete",
        MANAGE: "self.workload.containers.manage",
        LOGS: "self.workload.containers.logs",
      },
      stacks: {
        INDEX: "self.workload.stacks.index",
        SHOW: "self.workload.stacks.show",
        MANAGE: "self.workload.stacks.manage",
        DELETE: "self.workload.stacks.delete",
      },
    },
  },
  users: {
    CREATE: "users.create",
    DELETE: "users.delete",
    IMPERSONATE: "users.impersonate",
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
