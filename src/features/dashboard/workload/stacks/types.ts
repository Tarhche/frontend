import {type Author} from "@/features/authors/types";
import {
  type ChosenVm,
  type Container,
  type VmTarget,
} from "@/features/dashboard/workload/docker/types";

/**
 * A compose project deployed into a Docker VM. Its compose file is kept as it
 * was given, and never changes: a different stack is a new stack.
 *
 * - state: what the last compose command left it as: deploying | running |
 *   starting | stopping | stopped | restarting | removing | failed.
 * - expected_state: what it was asked to be, running or stopped.
 * - output: the tail of what the last compose command printed.
 * - compose: the file itself, which a listing leaves out and one stack's read
 *   carries.
 */
export type Stack = {
  uuid: string;
  name: string;

  /** the compose project's name inside the VM, which its containers carry. */
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
  output?: string;
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
