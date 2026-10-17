import {
  vmTarget,
  type VmChoice,
} from "@/features/dashboard/workload/docker/components/docker-vm-select/choice";
import {type StackCreateRequest} from "../../types";

/** The most a stack's file may be, as the platform takes them. */
export const MAX_COMPOSE_BYTES = 256 * 1024;

/**
 * A file to start from, as the platform takes one: two services, the web one
 * started after the cache, which keeps what it holds in a volume the file
 * declares, and both started again whenever they end, but for being stopped.
 */
export const EXAMPLE_COMPOSE = `services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
    depends_on:
      - cache
    restart: unless-stopped
  cache:
    image: redis:7-alpine
    volumes:
      - cache-data:/data
    restart: unless-stopped

volumes:
  cache-data:
`;

/**
 * What the platform takes of the compose file format: the keys at the top of
 * a stack's file, and those of each of its services. It makes what the file
 * says itself, so it refuses anything else rather than leave it out.
 */
export const FILE_KEYS = ["services", "volumes", "networks"] as const;

export const SERVICE_KEYS = [
  "image",
  "command",
  "entrypoint",
  "environment",
  "ports",
  "volumes",
  "networks",
  "depends_on",
  "restart",
  "privileged",
  "pids_limit",
  "user",
  "runtime",
  "resources.limits.cpus",
  "resources.limits.memory",
] as const;

/**
 * What is wrong with a stack as written, by field, as the words' keys:
 * required, or tooLarge for a file past what the platform takes.
 */
export type StackErrors = Record<string, string>;

/**
 * The request for a stack as written. Its file is sent exactly as it was
 * written: it is kept that way, and whether the platform takes it is the
 * platform's to say, which the answer carries back, by where in the file each
 * thing it refused is, when it does not.
 */
export function stackRequest(
  values: {name: string; compose: string},
  choice: VmChoice,
): {body: StackCreateRequest; errors: StackErrors} {
  const errors: StackErrors = {};

  const name = values.name.trim();
  if (name.length === 0) {
    errors.name = "required";
  }

  if (values.compose.trim().length === 0) {
    errors.compose = "required";
  } else if (new Blob([values.compose]).size > MAX_COMPOSE_BYTES) {
    errors.compose = "tooLarge";
  }

  return {
    body: {...vmTarget(choice), name, compose: values.compose},
    errors,
  };
}

// the field a stack's file is sent as, and what is refused about it is said
// under: the file itself, or compose.<path> for what is wrong at that path in
// it.
const COMPOSE = "compose";

/** Whether a refusal is about the file: the file itself, or a path in it. */
export function isAboutTheFile(field: string): boolean {
  return field === COMPOSE || field.startsWith(`${COMPOSE}.`);
}

/** One thing refused about a stack's file, and where in the file it is. */
export type FileRefusal = {
  /**
   * The path in the file, as the API writes it: services.web.ports[0]. Empty
   * for the file as a whole.
   */
  path: string;
  message: string;
};

/**
 * Everything refused about a stack's file, out of everything refused about
 * the stack: the file as a whole first, then each path in it in order, each
 * with what the API said of it, which is already in the reader's language.
 */
export function fileRefusals(fields: Record<string, string>): FileRefusal[] {
  return Object.entries(fields)
    .filter(([field]) => isAboutTheFile(field))
    .map(([field, message]) => ({
      path: field.slice(COMPOSE.length + 1),
      message,
    }))
    .sort((a, b) => {
      if (a.path === b.path) {
        return 0;
      }

      if (a.path === "" || b.path === "") {
        return a.path === "" ? -1 : 1;
      }

      return a.path < b.path ? -1 : 1;
    });
}
