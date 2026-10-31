import {type Author} from "@/features/authors/types";
import {
  type ChosenVm,
  type Container,
  type VmTarget,
} from "@/features/dashboard/workload/docker/types";

/**
 * Where a stack is, as the platform names it. Deploying, starting, stopping,
 * restarting and removing are on the way somewhere; the rest are where it is.
 */
export const STACK_STATES = [
  "deploying",
  "running",
  "degraded",
  "starting",
  "stopping",
  "stopped",
  "restarting",
  "removing",
  "waiting",
  "failed",
] as const;

export type StackState = (typeof STACK_STATES)[number];

/**
 * The services, volumes and networks a file in the compose file format says,
 * which the platform makes in a Docker VM itself, in the order they need one
 * another: nothing runs compose. Its file is kept as it was given, and never
 * changes: a different stack is a new stack.
 *
 * - state: where it is, one of STACK_STATES. Degraded is a stack some of
 *   whose services do not run; waiting one that waits on what it needs, its
 *   VM not running, say; and failed one whose plan failed.
 * - expected_state: what it was asked to be, running or stopped.
 * - reason: why it waits, failed or is degraded.
 * - compose: the file itself, which a listing leaves out and one stack's read
 *   carries.
 */
export type Stack = {
  uuid: string;
  name: string;

  /**
   * what it is called inside its VM: what it makes there is named after it,
   * <slug>_<name>, and its containers carry it as their stack.
   */
  slug: string;
  owner_uuid: string;

  /** who it belongs to, as the API says beside the uuid. */
  owner?: Partial<Author> | null;
  vm_uuid: string;
  vm_name?: string;
  compose?: string;
  expected_state?: string;
  state: string;
  reason?: string;
  created_at: string;
  updated_at?: string;
};

/**
 * A stack with its containers, as its VM's dockerd lists them now. A VM that
 * is not running has none to list, which `note` says (vm_not_running) rather
 * than letting an empty list pass for a stack with nothing in it.
 */
export type StackDetail = Stack & {
  containers?: Container[];
  note?: string;
};

export type StackCreateRequest = VmTarget & {
  name: string;
  compose: string;
};

export type StackCreateResponse = {
  vm: ChosenVm;
  stack: Stack;
};

export type StackCommand = "start" | "stop" | "restart";
