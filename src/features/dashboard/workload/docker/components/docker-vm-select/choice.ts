import {GiB, portNumber} from "../../format";
import {type Vm, type VmTarget} from "../../types";
import {vmReadiness} from "../../vm-state";

/** What the select holds for "a new Docker VM". No VM's uuid is this. */
export const NEW_VM = "new";

/**
 * The Docker VM to create, as somebody edits it: sizes in GiB, as typed. A size
 * left empty is left to the platform's default.
 */
export type NewDockerVm = {
  name: string;
  cpus: number | "";
  memoryGiB: number | "";
  diskGiB: number | "";
  ports: number[];
  ingress: boolean;
  egress: boolean;
};

/**
 * What the platform gives a Docker VM nobody said anything about. They are
 * shown as they are, and sent as shown: what somebody sees is what they get.
 */
export const DOCKER_VM_DEFAULTS: NewDockerVm = {
  name: "docker",
  cpus: 2,
  memoryGiB: 2,
  diskGiB: 20,
  ports: [80, 443, 8080],
  ingress: true,
  egress: true,
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

// sizes go to the API in bytes, as every size does.
function bytesOf(gib: number | ""): number | undefined {
  return gib === "" ? undefined : Math.round(gib * GiB);
}

/** What a choice adds to a create request. */
export function vmTarget(choice: VmChoice): VmTarget {
  switch (choice.kind) {
    case "existing":
      return {vm_uuid: choice.vm.uuid};
    case "new":
      return {
        vm: {
          name: choice.vm.name.trim() || undefined,
          resources: {
            cpus: choice.vm.cpus === "" ? undefined : choice.vm.cpus,
            memory: bytesOf(choice.vm.memoryGiB),
            disk: bytesOf(choice.vm.diskGiB),
          },
          ports: choice.vm.ports,
          network: {
            ingress: choice.vm.ingress ? "allow" : "deny",
            egress: choice.vm.egress ? "allow" : "deny",
          },
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

/** The ports somebody typed, as the sorted, distinct ports they can be. */
export function portsFrom(values: string[]): {
  ports: number[];
  rejected: string[];
} {
  const ports = new Set<number>();
  const rejected: string[] = [];

  for (const value of values) {
    const port = portNumber(value.trim());
    if (port === null) {
      rejected.push(value);
    } else {
      ports.add(port);
    }
  }

  return {ports: [...ports].sort((a, b) => a - b), rejected};
}
