import {type Vm, type VmState} from "../types";

/**
 * What a VM's state allows. The API is what refuses; this only says what is
 * worth offering.
 */

// the states a VM passes through rather than stays in.
const IN_FLIGHT: readonly string[] = [
  "created",
  "scheduled",
  "starting",
  "stopping",
  "restarting",
  "restoring",
  "deleting",
];

/**
 * Whether a VM is on its way somewhere: in a passing state, or not yet where
 * it was asked to be. What is read about one of these is worth reading again
 * soon.
 */
export function isInFlight(vm: Pick<Vm, "state" | "expected_state">): boolean {
  if (IN_FLIGHT.includes(vm.state)) {
    return true;
  }

  return (
    !!vm.expected_state &&
    vm.expected_state !== vm.state &&
    vm.state !== "failed"
  );
}

export function canStart(state: VmState): boolean {
  return state === "stopped" || state === "failed";
}

export function canStop(state: VmState): boolean {
  return (
    state === "running" ||
    state === "starting" ||
    state === "restarting" ||
    state === "scheduled" ||
    state === "created"
  );
}

export function canRestart(state: VmState): boolean {
  return state === "running";
}

/** A snapshot is taken of a VM that is running or stopped, and only then. */
export function canSnapshot(state: VmState): boolean {
  return state === "running" || state === "stopped";
}

/** A restore replaces a VM's disk, which it cannot do halfway through else. */
export function canRestore(state: VmState): boolean {
  return state === "running" || state === "stopped" || state === "failed";
}

/**
 * What a Docker VM's state means for the things inside it.
 *
 * - running: dockerd answers.
 * - booting: on its way up. A request waits for dockerd to be ready, so it may
 *   be sent, but it takes a while.
 * - stopped: nothing answers until it is started.
 * - failed: nothing answers; its reason says why.
 * - gone: it is being deleted.
 */
export type VmReadiness = "running" | "booting" | "stopped" | "failed" | "gone";

const READINESS: Record<VmState, VmReadiness> = {
  running: "running",
  created: "booting",
  scheduled: "booting",
  starting: "booting",
  restarting: "booting",
  restoring: "booting",
  stopping: "stopped",
  stopped: "stopped",
  failed: "failed",
  deleting: "gone",
};

export function vmReadiness(state: string): VmReadiness {
  // a state nobody has named here yet is not one to send anything to.
  return READINESS[state as VmState] ?? "stopped";
}
