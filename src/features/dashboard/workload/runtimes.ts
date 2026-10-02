/**
 * The classes a task can be run as.
 *
 * A runtime class is the name a task asks to be run with: a container, a
 * microVM, or whatever else the workload comes to offer. Which classes there
 * are, which one is the default and what each can do is the workload's to
 * say, so nothing here lists them; this only reads what it said.
 */

/**
 * What a task that names no class runs as, and what every task ran as before
 * there were classes to name.
 */
export const DEFAULT_RUNTIME = "sysbox";

/** What a class can do, as the nodes running it right now agree on. */
export type RuntimeCapabilities = {
  /** "container" or "microvm". */
  isolation?: string;
  network_policies?: string[];
  stack_networks?: boolean;
  read_only_root?: boolean;
  disk_limit?: boolean;
  tty?: boolean;
  restart_policies?: string[];

  /** in bytes; zero is no minimum. */
  min_memory?: number;

  /** in bytes; zero is no limit. */
  max_memory?: number;

  /** in cores; zero is no limit. */
  max_cpu?: number;
  architectures?: string[];
};

/** One class, as the workload offers it right now. */
export type Runtime = {
  class: string;

  /** whether a task that names no class is run as this one. */
  default: boolean;

  /** whether any node can run it right now. */
  available: boolean;
  nodes: number;
  capabilities?: RuntimeCapabilities;
};

/** Why a class cannot be chosen, when it cannot. */
export type Refusal = "unavailable" | "noStackNetworks";

/** The class a task was run as. */
export function runtimeOf(runtime?: string | null): string {
  return runtime || DEFAULT_RUNTIME;
}

/**
 * Why a class cannot be chosen here: no node can run it right now, or what is
 * being run is a stack and the class cannot give its services a network to
 * share.
 */
export function refusalOf(
  runtime: Runtime,
  {stack = false}: {stack?: boolean} = {},
): Refusal | undefined {
  if (!runtime.available) {
    return "unavailable";
  }

  if (stack && runtime.capabilities?.stack_networks === false) {
    return "noStackNetworks";
  }

  return undefined;
}

/**
 * The class a form starts on: the workload's default, unless it cannot be
 * chosen, in which case the first one that can. When none can, the default is
 * still what is shown, since it is what the workload falls back to.
 */
export function initialRuntime(
  runtimes: Runtime[],
  options?: {stack?: boolean},
): string | undefined {
  const choosable = runtimes.filter((runtime) => !refusalOf(runtime, options));

  const initial =
    choosable.find((runtime) => runtime.default) ??
    choosable[0] ??
    runtimes.find((runtime) => runtime.default) ??
    runtimes[0];

  return initial?.class;
}

/**
 * What the chosen class can do, when that is known. A class no node can run
 * right now has no nodes to agree on anything, so it is taken to restrict
 * nothing: what it cannot honour, the workload still refuses.
 */
export function capabilitiesOf(
  runtimes: Runtime[] | null | undefined,
  chosen: string | undefined,
): RuntimeCapabilities | undefined {
  const runtime = runtimes?.find((one) => one.class === chosen);

  return runtime?.available ? runtime.capabilities : undefined;
}

/**
 * Whether a class allows a value it lists the allowed ones of. A class that
 * lists none is not taken to refuse them all.
 */
export function allows(
  allowed: string[] | null | undefined,
  value: string,
): boolean {
  return !allowed?.length || allowed.includes(value);
}

/**
 * What was chosen, if the class allows it, and otherwise the first of
 * `instead` that it does.
 */
export function within(
  chosen: string,
  allowed: string[] | null | undefined,
  instead: readonly string[],
): string {
  if (allows(allowed, chosen)) {
    return chosen;
  }

  return instead.find((value) => allows(allowed, value)) ?? chosen;
}

/**
 * A size in bytes, written the way compose writes one and the memory field
 * takes it: 128M rather than 134217728.
 */
export function composeSize(bytes: number): string {
  const units: [string, number][] = [
    ["G", 1024 ** 3],
    ["M", 1024 ** 2],
    ["K", 1024],
  ];

  for (const [unit, size] of units) {
    if (bytes >= size && bytes % size === 0) {
      return `${bytes / size}${unit}`;
    }
  }

  return `${bytes}b`;
}

/**
 * What a class is called in the reader's own language. One nobody has named
 * yet is called what the workload calls it.
 */
export function runtimeName(
  t: (key: string) => string,
  runtime: string,
): string {
  return translated(t, `tasks.runtime.classes.${runtime}`) ?? runtime;
}

/** A line on what a class is, for the classes there are words for. */
export function runtimeHint(
  t: (key: string) => string,
  runtime: string,
): string | undefined {
  return translated(t, `tasks.runtime.hints.${runtime}`);
}

function translated(
  t: (key: string) => string,
  key: string,
): string | undefined {
  const words = t(key);

  return words && words !== key ? words : undefined;
}
