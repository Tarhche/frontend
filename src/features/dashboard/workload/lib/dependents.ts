import {APP_PATHS} from "@/lib/app-paths";

/*
 * What needs something that is deleted, as a delete of it is answered.
 *
 * A VM, and a Docker VM's networks and volumes, may be needed by the stacks
 * and the containers no stack owns that are in it or use them. Deleting one
 * of these is answered with what needs it, whether it is deleted or refused,
 * and with whether any of them makes it again once it is gone: a stack or a
 * container whose graph made it does, unless it is deleted along with it, and
 * one that only named what was there before it waits for it to come back.
 */

/**
 * Something that needs what is deleted.
 *
 * - kind: stack or container.
 * - recreates: it makes what is deleted again once it is gone, under the same
 *   uuid and slug for a VM, unless it is deleted along with it; otherwise it
 *   only waits for it to come back.
 */
export type Dependent = {
  kind: string;
  uuid: string;
  name?: string;
  recreates: boolean;
};

/** What a delete of something others may need is answered with. */
export type Removal = {
  dependents: Dependent[];

  /** whether any of them makes it again. */
  recreated: boolean;
};

/** What a delete nothing needs is answered with, which says nothing. */
export const NOTHING_NEEDS_IT: Removal = {dependents: [], recreated: false};

/** How a delete of something others may need is asked for. */
export type RemoveOptions = {
  /** delete what needs it along with it. */
  cascade?: boolean;

  /** delete nothing, and only say what needs it. */
  dryRun?: boolean;
};

/**
 * The query a delete is asked with: only what it asks for, and nothing when
 * it asks for nothing, as a plain delete always was.
 */
export function removeParams(
  options: RemoveOptions & {force?: boolean},
): Record<string, true> | undefined {
  const params: Record<string, true> = {};

  if (options.force) {
    params.force = true;
  }

  if (options.cascade) {
    params.cascade = true;
  }

  if (options.dryRun) {
    params.dry_run = true;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * What needs it, read off what an answer says of it: each that says what kind
 * of thing it is and which one, and nothing for anything else.
 */
export function dependentsOf(value: unknown): Dependent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((each): Dependent[] => {
    if (
      !isRecord(each) ||
      typeof each.kind !== "string" ||
      typeof each.uuid !== "string" ||
      each.uuid.length === 0
    ) {
      return [];
    }

    return [
      {
        kind: each.kind,
        uuid: each.uuid,
        name: typeof each.name === "string" ? each.name : undefined,
        recreates: each.recreates === true,
      },
    ];
  });
}

/**
 * What a delete was answered with, read off its body: a delete nothing needs
 * may be answered with no body at all, which is nothing needing it.
 */
export function removalOf(data: unknown): Removal {
  if (!isRecord(data)) {
    return NOTHING_NEEDS_IT;
  }

  const dependents = dependentsOf(data.dependents);

  return {
    dependents,
    recreated: data.recreated === true && dependents.length > 0,
  };
}

/**
 * Which of what needs something of somebody's may be looked at by whoever is
 * looking: that person's stacks, and their containers.
 */
export type DependentsVisible = {
  stacks: boolean;
  containers: boolean;
};

/**
 * Where something that needs what is deleted is looked at, for whoever may: a
 * stack's page, or a container's, by its uuid in the VM it is in, which is
 * the VM deleted or the one holding what is. Null where they may not, and for
 * anything else.
 */
export function dependentHref(
  dependent: Dependent,
  vmUuid: string,
  visible: DependentsVisible,
): string | null {
  switch (dependent.kind) {
    case "stack":
      return visible.stacks
        ? APP_PATHS.dashboard.stacks.detail(dependent.uuid)
        : null;
    case "container":
      return visible.containers
        ? APP_PATHS.dashboard.containers.detail(vmUuid, dependent.uuid)
        : null;
    default:
      return null;
  }
}
