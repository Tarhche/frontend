import {type Vm} from "../types";

/**
 * The code runner's runs among the VMs.
 *
 * Each snippet somebody runs from an article runs in a VM of its own until it
 * ends, as the guest's, and reaches the public internet. The API lists them
 * among everybody's VMs, never among anybody's own, and says the code runner
 * keeps them. One has every tab a VM has: it is stopped, deleted and read; its
 * terminal is its task's, which anybody may open (target "tasks"); a snapshot
 * of it is whoever takes it, and is restored as a new VM, never onto the run;
 * and its settings are its task's, changing which runs its snippet again from
 * the start. Its lifetime is its snippet's and is not changed, it is never
 * started, restarted or restored, and it is gone once its snippet has ended.
 */

/** What the API says keeps a run (managed_by). */
export const CODE_RUNNER = "code-runner";

/** Whether a VM is a run of the code runner's. */
export function isCodeRunnerRun(
  vm: Pick<Vm, "managed_by"> | null | undefined,
): boolean {
  return vm?.managed_by === CODE_RUNNER;
}
