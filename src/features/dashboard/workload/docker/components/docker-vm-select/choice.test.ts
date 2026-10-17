import {GiB} from "@/features/dashboard/workload/vms/lib/units";
import {dockerVm} from "../../test-utils";
import {
  choiceIssue,
  DOCKER_VM_DEFAULTS,
  NEW_VM,
  resolveChoice,
  vmTarget,
} from "./choice";

const one = dockerVm({uuid: "vm-1", name: "one"});
const two = dockerVm({uuid: "vm-2", name: "two", state: "stopped"});
const three = dockerVm({uuid: "vm-3", name: "three"});

describe("resolveChoice, creating something", () => {
  it("creates a Docker VM for somebody who has none", () => {
    expect(resolveChoice([], null, DOCKER_VM_DEFAULTS, true)).toEqual({
      kind: "new",
      vm: DOCKER_VM_DEFAULTS,
    });
  });

  it("puts it in the only Docker VM there is", () => {
    expect(resolveChoice([one], null, DOCKER_VM_DEFAULTS, true)).toEqual({
      kind: "existing",
      vm: one,
    });
  });

  it("picks nothing out of several: that is the person's to say", () => {
    expect(resolveChoice([one, two], null, DOCKER_VM_DEFAULTS, true).kind).toBe(
      "unset",
    );
  });

  it("goes with what was picked, a new one included", () => {
    expect(resolveChoice([one, two], "vm-2", DOCKER_VM_DEFAULTS, true)).toEqual(
      {kind: "existing", vm: two},
    );
    expect(
      resolveChoice([one, two], NEW_VM, DOCKER_VM_DEFAULTS, true).kind,
    ).toBe("new");
  });

  it("forgets a pick whose VM went away", () => {
    expect(resolveChoice([one], "vm-gone", DOCKER_VM_DEFAULTS, true)).toEqual({
      kind: "existing",
      vm: one,
    });
  });

  it("decides nothing before the VMs are known", () => {
    expect(resolveChoice(undefined, null, DOCKER_VM_DEFAULTS, true).kind).toBe(
      "unset",
    );
  });
});

describe("resolveChoice, looking into a VM", () => {
  it("shows the first running one of several", () => {
    expect(
      resolveChoice([two, three], null, DOCKER_VM_DEFAULTS, false),
    ).toEqual({kind: "existing", vm: three});
  });

  it("offers no new VM", () => {
    expect(resolveChoice([], NEW_VM, DOCKER_VM_DEFAULTS, false).kind).toBe(
      "unset",
    );
  });
});

describe("vmTarget", () => {
  it("names a VM that was picked by its uuid", () => {
    expect(vmTarget({kind: "existing", vm: one})).toEqual({vm_uuid: "vm-1"});
  });

  it("describes a new one in bytes, with its network in the API's words", () => {
    expect(
      vmTarget({
        kind: "new",
        vm: {
          ...DOCKER_VM_DEFAULTS,
          memory: {amount: 1.5, unit: "GiB"},
          egress: false,
        },
      }),
    ).toEqual({
      vm: {
        name: "docker",
        resources: {cpus: 2, memory: 1.5 * GiB, disk: 20 * GiB},
        ports: [80, 443, 8080],
        network: {ingress: "allow", egress: "deny"},
      },
    });
  });

  it("leaves a size nobody gave to the platform", () => {
    const target = vmTarget({
      kind: "new",
      vm: {
        ...DOCKER_VM_DEFAULTS,
        name: " ",
        cpus: 0,
        disk: {amount: 0, unit: "GiB"},
      },
    });

    expect(JSON.parse(JSON.stringify(target))).toEqual({
      vm: {
        resources: {memory: 2 * GiB},
        ports: [80, 443, 8080],
        network: {ingress: "allow", egress: "allow"},
      },
    });
  });

  it("adds nothing when the platform is left to choose", () => {
    expect(vmTarget({kind: "unset"})).toEqual({});
  });
});

describe("choiceIssue", () => {
  it("asks for a pick out of several", () => {
    expect(choiceIssue({kind: "unset"}, [one, two])).toBe("pick");
  });

  it("does not hold up what the platform was left to choose", () => {
    expect(choiceIssue({kind: "unset"}, undefined)).toBeNull();
  });

  it("refuses a VM that is not running, but waits on one starting", () => {
    expect(choiceIssue({kind: "existing", vm: two}, [one, two])).toBe(
      "not_running",
    );
    expect(
      choiceIssue({kind: "existing", vm: dockerVm({state: "starting"})}, [
        one,
        two,
      ]),
    ).toBeNull();
  });
});
