import {
  defaultVmFormValues,
  networkFromToggles,
} from "@/features/dashboard/workload/vms/lib/form";
import {vmReadiness} from "@/features/dashboard/workload/vms/lib/state";
import {type Size, toBytes} from "@/features/dashboard/workload/vms/lib/units";
import {type Vm} from "@/features/dashboard/workload/vms/types";
import {type VmTarget} from "../../types";

/** What the select holds for "a new Docker VM". No VM's uuid is this. */
export const NEW_VM = "new";

/**
 * The Docker VM to create, as somebody edits it: the VM form's own fields
 * (vms/lib/form.ts), with sizes as typed. A size left empty is left to the
 * platform's default.
 */
export type NewDockerVm = {
  name: string;
  cpus: number;
  memory: Size;
  disk: Size;
  ports: number[];
  ingress: boolean;
  egress: boolean;
};

const DOCKER_FORM = defaultVmFormValues("docker");

/**
 * What the platform gives a Docker VM nobody said anything about, which is
 * what the VM form starts a Docker VM with too. They are shown as they are,
 * and sent as shown: what somebody sees is what they get.
 */
export const DOCKER_VM_DEFAULTS: NewDockerVm = {
  name: "docker",
  cpus: DOCKER_FORM.cpus,
  memory: DOCKER_FORM.memory,
  disk: DOCKER_FORM.disk,
  ports: [...DOCKER_FORM.ports],
  ingress: DOCKER_FORM.ingress,
  egress: DOCKER_FORM.egress,
};

/**
 * Where something is to go.
 *
 * - existing: a Docker VM the person has.
 * - new: one to create along with it.
 * - unset: one is still to be picked from several, or none could be listed,
 *   which leaves the choice to the platform.
 */
export type VmChoice =
  {kind: "existing"; vm: Vm} | {kind: "new"; vm: NewDockerVm} | {kind: "unset"};

/**
 * Which VM a form stands for, from the VMs there are and what was picked.
 *
 * Creating something: with no Docker VM, one is created; with one, it is the
 * one; with several, the person picks one of them or a new one, and nothing
 * is picked for them. Looking at what is in a VM: one is always shown when
 * there is one, the first running one unless another was picked.
 */
export function resolveChoice(
  vms: Vm[] | undefined,
  picked: string | null,
  newVm: NewDockerVm,
  allowNew: boolean,
): VmChoice {
  if (vms === undefined) {
    return {kind: "unset"};
  }

  if (allowNew && picked === NEW_VM) {
    return {kind: "new", vm: newVm};
  }

  const pickedVm = vms.find((vm) => vm.uuid === picked);
  if (pickedVm) {
    return {kind: "existing", vm: pickedVm};
  }

  if (vms.length === 0) {
    return allowNew ? {kind: "new", vm: newVm} : {kind: "unset"};
  }

  if (vms.length === 1) {
    return {kind: "existing", vm: vms[0]};
  }

  if (allowNew) {
    return {kind: "unset"};
  }

  return {
    kind: "existing",
    vm: vms.find((vm) => vmReadiness(vm.state) === "running") ?? vms[0],
  };
}

/** What a choice adds to a create request. */
export function vmTarget(choice: VmChoice): VmTarget {
  switch (choice.kind) {
    case "existing":
      return {vm_uuid: choice.vm.uuid};
    case "new":
      // sizes go to the API in bytes, as every size does; one left empty is
      // not sent, and the platform's default is what it gets.
      return {
        vm: {
          name: choice.vm.name.trim() || undefined,
          resources: {
            cpus: choice.vm.cpus > 0 ? Math.trunc(choice.vm.cpus) : undefined,
            memory: toBytes(choice.vm.memory) || undefined,
            disk: toBytes(choice.vm.disk) || undefined,
          },
          ports: choice.vm.ports,
          network: networkFromToggles(choice.vm),
        },
      };
    case "unset":
      return {};
  }
}

/** Why a choice cannot be sent as it is. */
export type ChoiceIssue = "pick" | "not_running" | "failed" | "gone";

/**
 * Whether a choice can be sent. Several VMs and none picked is the person's to
 * settle; a VM that is stopped, failed or going away has nothing in it to ask.
 * A VM on its way up is fine: the request waits for its dockerd.
 */
export function choiceIssue(
  choice: VmChoice,
  vms: Vm[] | undefined,
): ChoiceIssue | null {
  if (choice.kind === "unset") {
    return vms !== undefined && vms.length > 1 ? "pick" : null;
  }

  if (choice.kind === "new") {
    return null;
  }

  switch (vmReadiness(choice.vm.state)) {
    case "stopped":
      return "not_running";
    case "failed":
      return "failed";
    case "gone":
      return "gone";
    default:
      return null;
  }
}
