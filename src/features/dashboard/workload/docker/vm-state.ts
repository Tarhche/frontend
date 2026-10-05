import {type Vm} from "./types";

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

const READINESS: Record<string, VmReadiness> = {
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
  return READINESS[state] ?? "stopped";
}

/** Whether something may be asked of the VM's dockerd now, or once it is up. */
export function acceptsRequests(vm: Vm): boolean {
  const readiness = vmReadiness(vm.state);

  return readiness === "running" || readiness === "booting";
}

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
 * soon. It is the VM pages' own test (vms/lib/state.ts), so that both read a
 * VM the same way.
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
