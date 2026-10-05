"use client";

import {useState} from "react";
import {type VmSource} from "@/features/dashboard/workload/vms/permissions";
import {useVmChoices} from "@/features/dashboard/workload/vms/hooks/queries";
import {
  DOCKER_VM_DEFAULTS,
  resolveChoice,
  type NewDockerVm,
  type VmChoice,
} from "./choice";

type Options = {
  /** whether a new Docker VM may be asked for, as a create form may. */
  allowNew: boolean;

  /** the VM to start on, when the address names one. */
  initial?: string | null;
};

/**
 * Which Docker VM a page is about, and everything it takes to change that.
 *
 * Only what the person picked is kept: which VM that means is worked out from
 * the VMs there are each time, so a VM that goes away takes the pick with it
 * rather than leaving the form pointing at nothing.
 */
export function useDockerVmChoice(
  source: VmSource | null,
  {allowNew, initial = null}: Options,
) {
  const query = useVmChoices(source, {kind: "docker"});
  const [picked, pick] = useState<string | null>(initial);
  const [newVm, setNewVm] = useState<NewDockerVm>(DOCKER_VM_DEFAULTS);

  const vms = source === null ? undefined : query.data;
  const choice: VmChoice = resolveChoice(vms, picked, newVm, allowNew);

  return {
    source,
    vms,
    allowNew,
    loading: source !== null && query.isPending,
    failed: source !== null && query.isError && vms === undefined,
    error: query.error,
    refetch: query.refetch,
    refetching: query.isFetching,
    picked,
    pick,
    newVm,
    setNewVm,
    choice,
  };
}

export type DockerVmChoiceState = ReturnType<typeof useDockerVmChoice>;
