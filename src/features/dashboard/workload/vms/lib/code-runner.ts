import {type Vm} from "../types";

/**
 * The code runner's runs among the VMs.
 *
 * Each snippet somebody runs from an article runs in a VM of its own until it
 * ends, as the guest's. The API lists them among everybody's VMs, never among
 * anybody's own, and says the code runner keeps them. One can be stopped,
 * deleted and read, and nothing else: there is no terminal, snapshot or
 * setting to it, and it is gone once its snippet has ended.
 */

/** What the API says keeps a run (managed_by). */
export const CODE_RUNNER = "code-runner";

/** Whether a VM is a run of the code runner's. */
export function isCodeRunnerRun(
  vm: Pick<Vm, "managed_by"> | null | undefined,
): boolean {
  return vm?.managed_by === CODE_RUNNER;
}
