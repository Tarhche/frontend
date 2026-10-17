import {type Vm} from "../types";
import {
  buildCreateVmRequest,
  buildUpdateVmRequest,
  CUSTOM_IMAGE,
  defaultVmFormValues,
  fieldErrorsFrom,
  networkFromToggles,
  readPorts,
  restartsOnApply,
  switchKind,
  togglesFromNetwork,
  validateVmForm,
  type VmFormValues,
  vmFormValuesFrom,
} from "./form";
import {GiB, MiB} from "./units";

function machine(values: Partial<VmFormValues> = {}): VmFormValues {
  return {...defaultVmFormValues("machine"), name: "web", ...values};
}

const vm: Vm = {
  uuid: "vm-1",
  name: "web",
  slug: "web-a1b2c",
  owner_uuid: "me",
  kind: "machine",
  image: "ubuntu:24.04",
  resources: {cpus: 2, memory: 2 * GiB, disk: 20 * GiB},
  ports: [8080, 80],
  network: {ingress: "allow", egress: "deny"},
  persistent_disk: true,
  lifetime_seconds: 0,
  state: "running",
  created_at: "2026-10-04T10:00:00Z",
};

describe("the network switches", () => {
  it("are sent as allow or deny, each on its own", () => {
    expect(networkFromToggles({ingress: true, egress: true})).toEqual({
      ingress: "allow",
      egress: "allow",
    });
    expect(networkFromToggles({ingress: true, egress: false})).toEqual({
      ingress: "allow",
      egress: "deny",
    });
    expect(networkFromToggles({ingress: false, egress: true})).toEqual({
      ingress: "deny",
      egress: "allow",
    });
    expect(networkFromToggles({ingress: false, egress: false})).toEqual({
      ingress: "deny",
      egress: "deny",
    });
  });

  it("are on only for what is allowed", () => {
    expect(togglesFromNetwork({ingress: "allow", egress: "deny"})).toEqual({
      ingress: true,
      egress: false,
    });
    expect(togglesFromNetwork(null)).toEqual({ingress: false, egress: false});
  });

  it("go into the request as the network the API takes", () => {
    const request = buildCreateVmRequest(
      machine({ingress: false, egress: true}),
    );

    expect(request.network).toEqual({ingress: "deny", egress: "allow"});
  });
});

describe("creating a VM", () => {
  it("sends its sizes as bytes", () => {
    const request = buildCreateVmRequest(
      machine({
        cpus: 2,
        memory: {amount: 512, unit: "MiB"},
        disk: {amount: 1.5, unit: "GiB"},
      }),
    );

    expect(request.resources).toEqual({
      cpus: 2,
      memory: 512 * MiB,
      disk: 1536 * MiB,
    });
  });

  it("sends a machine's image, a preset or the one typed in", () => {
    expect(buildCreateVmRequest(machine({image: "debian:12"})).image).toBe(
      "debian:12",
    );
    expect(
      buildCreateVmRequest(
        machine({image: CUSTOM_IMAGE, customImage: " ghcr.io/me/os:1 "}),
      ).image,
    ).toBe("ghcr.io/me/os:1");
  });

  it("sends no image for a Docker VM, whose image is the workload's", () => {
    const request = buildCreateVmRequest({
      ...defaultVmFormValues("docker"),
      name: "builds",
    });

    expect(request.kind).toBe("docker");
    expect(request).not.toHaveProperty("image");
  });

  it("sends its ports sorted, each once, and its lifetime in seconds", () => {
    const request = buildCreateVmRequest(
      machine({
        ports: [8080, 80, 8080],
        lifetime: {keep: false, amount: 2, unit: "days"},
      }),
    );

    expect(request.ports).toEqual([80, 8080]);
    expect(request.lifetime_seconds).toBe(2 * 24 * 60 * 60);
  });

  it("keeps it until it is deleted unless told otherwise", () => {
    expect(buildCreateVmRequest(machine()).lifetime_seconds).toBe(0);
  });

  it("restores from a snapshot: its kind, no image, and a disk at least as large", () => {
    const snapshot = {uuid: "snap-1", kind: "docker" as const, disk: 30 * GiB};
    const request = buildCreateVmRequest(
      machine({
        image: "debian:12",
        disk: {amount: 10, unit: "GiB"},
        snapshotUuid: "snap-1",
      }),
      snapshot,
    );

    expect(request.snapshot_uuid).toBe("snap-1");
    expect(request.kind).toBe("docker");
    expect(request.resources.disk).toBe(30 * GiB);
    expect(request).not.toHaveProperty("image");
  });

  it("keeps a larger disk than the snapshot's when one was asked for", () => {
    const request = buildCreateVmRequest(
      machine({disk: {amount: 40, unit: "GiB"}, snapshotUuid: "snap-1"}),
      {uuid: "snap-1", kind: "machine", disk: 30 * GiB},
    );

    expect(request.resources.disk).toBe(40 * GiB);
  });
});

describe("the form's own checks", () => {
  it("find nothing wrong with the defaults once it has a name", () => {
    expect(validateVmForm(machine())).toEqual({});
    expect(
      validateVmForm({...defaultVmFormValues("docker"), name: "d"}),
    ).toEqual({});
  });

  it("want a name", () => {
    expect(validateVmForm(machine({name: "  "}))).toEqual({name: "required"});
  });

  it("want whole vCPUs, at least one", () => {
    expect(validateVmForm(machine({cpus: 0})).cpus).toBe("cpus");
    expect(validateVmForm(machine({cpus: 1.5})).cpus).toBe("cpus");
  });

  it("want a size for memory and disk", () => {
    const errors = validateVmForm(
      machine({
        memory: {amount: 0, unit: "MiB"},
        disk: {amount: 0, unit: "GiB"},
      }),
    );

    expect(errors.memory).toBe("size");
    expect(errors.disk).toBe("size");
  });

  it("want a disk no smaller than it must be", () => {
    expect(
      validateVmForm(machine({disk: {amount: 10, unit: "GiB"}}), {
        minDisk: 20 * GiB,
      }).disk,
    ).toBe("diskMin");
  });

  it("want a custom image typed in, without spaces", () => {
    expect(validateVmForm(machine({image: CUSTOM_IMAGE})).image).toBe(
      "required",
    );
    expect(
      validateVmForm(machine({image: CUSTOM_IMAGE, customImage: "a b"})).image,
    ).toBe("image");
  });

  it("do not ask a Docker VM or a restore for an image", () => {
    expect(
      validateVmForm({
        ...defaultVmFormValues("docker"),
        name: "d",
        image: CUSTOM_IMAGE,
      }).image,
    ).toBeUndefined();
    expect(
      validateVmForm(machine({image: CUSTOM_IMAGE, snapshotUuid: "snap-1"}))
        .image,
    ).toBeUndefined();
  });

  it("want at most sixteen ports, each a port", () => {
    const many = Array.from({length: 17}, (_, i) => 1000 + i);

    expect(validateVmForm(machine({ports: many})).ports).toBe("tooManyPorts");
    expect(validateVmForm(machine({ports: [0]})).ports).toBe("port");
    expect(validateVmForm(machine({ports: [65536]})).ports).toBe("port");
  });

  it("want a lifetime when it is not kept", () => {
    expect(
      validateVmForm(
        machine({lifetime: {keep: false, amount: 0, unit: "hours"}}),
      ).lifetime,
    ).toBe("lifetime");
  });
});

describe("the ports field", () => {
  it("keeps what are ports, sorted and once, and says what is not", () => {
    expect(readPorts(["8080", " 80 ", "80", "http", "0", "70000", ""])).toEqual(
      {
        ports: [80, 8080],
        rejected: ["http", "0", "70000"],
      },
    );
  });
});

describe("switching kind", () => {
  it("takes the other kind's defaults for what was left alone", () => {
    const docker = switchKind(machine(), "docker");

    expect(docker.kind).toBe("docker");
    expect(docker.cpus).toBe(2);
    expect(docker.memory).toEqual({amount: 2, unit: "GiB"});
    expect(docker.disk).toEqual({amount: 20, unit: "GiB"});
    expect(docker.ports).toEqual([80, 443, 8080]);
  });

  it("keeps what somebody changed", () => {
    const docker = switchKind(machine({cpus: 3, ports: [22]}), "docker");

    expect(docker.cpus).toBe(3);
    expect(docker.ports).toEqual([22]);
  });
});

describe("changing a VM", () => {
  it("sends nothing when nothing changed", () => {
    expect(buildUpdateVmRequest(vm, vmFormValuesFrom(vm))).toEqual({});
  });

  it("sends only what changed", () => {
    const request = buildUpdateVmRequest(vm, {
      ...vmFormValuesFrom(vm),
      name: "web-2",
    });

    expect(request).toEqual({name: "web-2"});
    expect(restartsOnApply(request)).toBe(false);
  });

  it("sends the resources whole, in bytes, when one of them changed", () => {
    const request = buildUpdateVmRequest(vm, {
      ...vmFormValuesFrom(vm),
      memory: {amount: 4, unit: "GiB"},
    });

    expect(request).toEqual({
      resources: {cpus: 2, memory: 4 * GiB, disk: 20 * GiB},
    });
    expect(restartsOnApply(request)).toBe(true);
  });

  it("says a change to the ports or the network restarts it", () => {
    const values = vmFormValuesFrom(vm);

    expect(
      restartsOnApply(buildUpdateVmRequest(vm, {...values, ports: [80]})),
    ).toBe(true);
    expect(buildUpdateVmRequest(vm, {...values, egress: true}).network).toEqual(
      {ingress: "allow", egress: "allow"},
    );
  });

  it("sends a new lifetime in seconds", () => {
    expect(
      buildUpdateVmRequest(vm, {
        ...vmFormValuesFrom(vm),
        lifetime: {keep: false, amount: 12, unit: "hours"},
      }),
    ).toEqual({lifetime_seconds: 12 * 60 * 60});
  });
});

describe("the API's validation errors", () => {
  it("are put beside the field they are about", () => {
    const {fields, rest} = fieldErrorsFrom({
      name: "taken",
      "resources.memory": "too much",
      disk: "too little",
      "ports.2": "out of range",
      "network.egress": "not allowed",
      lifetime_seconds: "too long",
      snapshot_uuid: "not ready",
    });

    expect(fields).toEqual({
      name: "taken",
      memory: "too much",
      disk: "too little",
      ports: "out of range",
      egress: "not allowed",
      lifetime: "too long",
      snapshot: "not ready",
    });
    expect(rest).toEqual([]);
  });

  it("say what is about no field above the form", () => {
    expect(fieldErrorsFrom({resources: "over your quota"}).rest).toEqual([
      "over your quota",
    ]);
  });
});
