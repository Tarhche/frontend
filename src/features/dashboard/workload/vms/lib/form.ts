import {
  type CreateVmRequest,
  type UpdateVmRequest,
  type Vm,
  type VmKind,
  type VmNetwork,
} from "../types";
import {KEEP, type Lifetime, lifetimeFrom, lifetimeSeconds} from "./lifetime";
import {fromBytes, type Size, toBytes} from "./units";

/**
 * The VM form: what it holds, what it starts from, and how what it holds
 * becomes what the API is sent. The form itself only draws this.
 */

/** The images a machine is offered, newest first. Anything else is typed in. */
export const IMAGE_PRESETS = [
  {value: "ubuntu:24.04", label: "Ubuntu 24.04"},
  {value: "debian:12", label: "Debian 12"},
  {value: "alpine:3.20", label: "Alpine 3.20"},
] as const;

/** What the image select says when the reference is typed in instead. */
export const CUSTOM_IMAGE = "custom";

/** At most this many ports may be exposed. */
export const MAX_PORTS = 16;

export type VmFormValues = {
  name: string;
  kind: VmKind;

  /** A preset's reference, or CUSTOM_IMAGE for the one in customImage. */
  image: string;
  customImage: string;
  cpus: number;
  memory: Size;
  disk: Size;
  ports: number[];

  /** Whether anything may reach its ports, and whether it may reach out. */
  ingress: boolean;
  egress: boolean;
  persistentDisk: boolean;
  lifetime: Lifetime;

  /** The snapshot a new VM is restored from, if it is. */
  snapshotUuid: string | null;
};

/** Every field of the form, by the name its errors are kept under. */
export type VmField =
  | "name"
  | "kind"
  | "image"
  | "cpus"
  | "memory"
  | "disk"
  | "ports"
  | "ingress"
  | "egress"
  | "persistentDisk"
  | "lifetime"
  | "snapshot";

type KindDefaults = Pick<VmFormValues, "cpus" | "memory" | "disk" | "ports">;

/**
 * What a VM of each kind starts with. A Docker VM's are the ones the workload
 * gives one it creates by itself, so the two kinds of Docker VM look alike.
 */
export const KIND_DEFAULTS: Record<VmKind, KindDefaults> = {
  machine: {
    cpus: 1,
    memory: {amount: 1, unit: "GiB"},
    disk: {amount: 10, unit: "GiB"},
    ports: [],
  },
  docker: {
    cpus: 2,
    memory: {amount: 2, unit: "GiB"},
    disk: {amount: 20, unit: "GiB"},
    ports: [80, 443, 8080],
  },
};

export function defaultVmFormValues(kind: VmKind = "machine"): VmFormValues {
  return {
    name: "",
    kind,
    image: IMAGE_PRESETS[0].value,
    customImage: "",
    ...KIND_DEFAULTS[kind],
    ingress: true,
    egress: true,
    persistentDisk: true,
    lifetime: KEEP,
    snapshotUuid: null,
  };
}

/**
 * The form for another kind. Whatever was left at the first kind's defaults
 * takes the second's; whatever somebody changed stays as they changed it.
 */
export function switchKind(values: VmFormValues, kind: VmKind): VmFormValues {
  if (values.kind === kind) {
    return values;
  }

  const was = KIND_DEFAULTS[values.kind];
  const next = KIND_DEFAULTS[kind];

  return {
    ...values,
    kind,
    cpus: values.cpus === was.cpus ? next.cpus : values.cpus,
    memory: sameSize(values.memory, was.memory) ? next.memory : values.memory,
    disk: sameSize(values.disk, was.disk) ? next.disk : values.disk,
    ports: samePorts(values.ports, was.ports) ? next.ports : values.ports,
  };
}

/** The two network switches, as the API takes them. */
export function networkFromToggles({
  ingress,
  egress,
}: {
  ingress: boolean;
  egress: boolean;
}): VmNetwork {
  return {
    ingress: ingress ? "allow" : "deny",
    egress: egress ? "allow" : "deny",
  };
}

/** And back: a direction is on only when it is allowed. */
export function togglesFromNetwork(network?: Partial<VmNetwork> | null): {
  ingress: boolean;
  egress: boolean;
} {
  return {
    ingress: network?.ingress === "allow",
    egress: network?.egress === "allow",
  };
}

export function isPort(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}

/** Ports in the order the API keeps them: ascending, each once. */
export function sortedPorts(ports: readonly number[]): number[] {
  return [...new Set(ports)].sort((a, b) => a - b);
}

/**
 * What was typed into the ports field, read as ports: the ones that are, and
 * what was typed that is not one.
 */
export function readPorts(entries: readonly string[]): {
  ports: number[];
  rejected: string[];
} {
  const ports: number[] = [];
  const rejected: string[] = [];

  for (const entry of entries) {
    const typed = entry.trim();
    if (typed === "") {
      continue;
    }

    const port = /^\d+$/.test(typed) ? Number(typed) : Number.NaN;
    if (isPort(port)) {
      ports.push(port);
    } else {
      rejected.push(typed);
    }
  }

  return {ports: sortedPorts(ports), rejected};
}

/**
 * The image to ask for. A Docker VM's is the workload's, and a restored VM's is
 * its snapshot's, so neither is the form's to say.
 */
export function imageOf(
  values: Pick<VmFormValues, "kind" | "image" | "customImage" | "snapshotUuid">,
): string | undefined {
  if (values.kind !== "machine" || values.snapshotUuid) {
    return undefined;
  }

  if (values.image === CUSTOM_IMAGE) {
    return values.customImage.trim() || undefined;
  }

  return values.image;
}

/** What the form needs to know about a snapshot it restores from. */
export type RestorableSnapshot = {
  uuid: string;
  kind: VmKind;
  disk: number;
};

/**
 * The VM to create, as the API takes it.
 *
 * A restore takes its kind and image from the snapshot, and a disk at least as
 * large as the one the snapshot was taken of.
 */
export function buildCreateVmRequest(
  values: VmFormValues,
  snapshot?: RestorableSnapshot | null,
): CreateVmRequest {
  const restoring =
    snapshot && values.snapshotUuid === snapshot.uuid ? snapshot : null;
  const kind = restoring ? restoring.kind : values.kind;
  const disk = toBytes(values.disk);

  const request: CreateVmRequest = {
    name: values.name.trim(),
    kind,
    resources: {
      cpus: Math.trunc(values.cpus),
      memory: toBytes(values.memory),
      disk: restoring ? Math.max(disk, restoring.disk) : disk,
    },
    ports: sortedPorts(values.ports),
    network: networkFromToggles(values),
    persistent_disk: values.persistentDisk,
    lifetime_seconds: lifetimeSeconds(values.lifetime),
  };

  const image = imageOf({
    ...values,
    kind,
    snapshotUuid: restoring?.uuid ?? null,
  });
  if (image) {
    request.image = image;
  }

  if (restoring) {
    request.snapshot_uuid = restoring.uuid;
  }

  return request;
}

/**
 * What is wrong with each field, before anything is sent: each is a key under
 * vms.form.errors. Bounds the workload is configured with -- the most memory a
 * VM may have, the longest it may live -- are the API's to say.
 */
export type VmFormErrors = Partial<Record<VmField, string>>;

export function validateVmForm(
  values: VmFormValues,
  {minDisk = 0}: {minDisk?: number} = {},
): VmFormErrors {
  const errors: VmFormErrors = {};

  if (values.name.trim() === "") {
    errors.name = "required";
  }

  if (
    values.kind === "machine" &&
    !values.snapshotUuid &&
    values.image === CUSTOM_IMAGE
  ) {
    const reference = values.customImage.trim();
    if (reference === "") {
      errors.image = "required";
    } else if (/\s/.test(reference)) {
      errors.image = "image";
    }
  }

  if (!Number.isInteger(values.cpus) || values.cpus < 1) {
    errors.cpus = "cpus";
  }

  if (toBytes(values.memory) <= 0) {
    errors.memory = "size";
  }

  const disk = toBytes(values.disk);
  if (disk <= 0) {
    errors.disk = "size";
  } else if (disk < minDisk) {
    errors.disk = "diskMin";
  }

  if (values.ports.length > MAX_PORTS) {
    errors.ports = "tooManyPorts";
  } else if (!values.ports.every(isPort)) {
    errors.ports = "port";
  }

  if (!values.lifetime.keep && lifetimeSeconds(values.lifetime) <= 0) {
    errors.lifetime = "lifetime";
  }

  return errors;
}

/** The form, filled in from a VM: what its settings start from. */
export function vmFormValuesFrom(vm: Vm): VmFormValues {
  return {
    name: vm.name,
    kind: vm.kind,
    image: vm.image,
    customImage: "",
    cpus: vm.resources.cpus,
    memory: fromBytes(vm.resources.memory),
    disk: fromBytes(vm.resources.disk),
    ports: sortedPorts(vm.ports ?? []),
    ...togglesFromNetwork(vm.network),
    persistentDisk: vm.persistent_disk,
    lifetime: lifetimeFrom(vm.lifetime_seconds),
    snapshotUuid: null,
  };
}

/**
 * What changed, as a PATCH: only what is different is sent, so renaming a VM
 * does not reconfigure it. Resources are sent whole when any one of them is.
 */
export function buildUpdateVmRequest(
  vm: Vm,
  values: VmFormValues,
): UpdateVmRequest {
  const before = vmFormValuesFrom(vm);
  const request: UpdateVmRequest = {};

  const name = values.name.trim();
  if (name !== vm.name) {
    request.name = name;
  }

  const ports = sortedPorts(values.ports);
  if (!samePorts(ports, before.ports)) {
    request.ports = ports;
  }

  const network = networkFromToggles(values);
  const wasNetwork = networkFromToggles(before);
  if (
    network.ingress !== wasNetwork.ingress ||
    network.egress !== wasNetwork.egress
  ) {
    request.network = network;
  }

  const lifetime = lifetimeSeconds(values.lifetime);
  if (lifetime !== lifetimeSeconds(before.lifetime)) {
    request.lifetime_seconds = lifetime;
  }

  const resources = {
    cpus: Math.trunc(values.cpus),
    memory: toBytes(values.memory),
    disk: toBytes(values.disk),
  };
  if (
    resources.cpus !== before.cpus ||
    resources.memory !== toBytes(before.memory) ||
    resources.disk !== toBytes(before.disk)
  ) {
    request.resources = resources;
  }

  return request;
}

/**
 * The VM as it is once a change has been saved: what the settings start from
 * next, without waiting for the VM to be read again.
 */
export function applyUpdate(vm: Vm, request: UpdateVmRequest): Vm {
  return {
    ...vm,
    ...(request.name !== undefined && {name: request.name}),
    ...(request.ports !== undefined && {ports: request.ports}),
    ...(request.network !== undefined && {network: request.network}),
    ...(request.lifetime_seconds !== undefined && {
      lifetime_seconds: request.lifetime_seconds,
    }),
    ...(request.resources !== undefined && {resources: request.resources}),
  };
}

/** Whether applying a change restarts a VM that is running. */
export function restartsOnApply(request: UpdateVmRequest): boolean {
  return (
    request.ports !== undefined ||
    request.network !== undefined ||
    request.resources !== undefined
  );
}

// where the API's validation errors belong on the form. The API names fields
// by their place in the JSON it was sent; a field it names that the form does
// not show is said above the form instead.
const API_FIELDS: ReadonlyArray<[RegExp, VmField]> = [
  [/^name$/, "name"],
  [/^kind$/, "kind"],
  [/^image$/, "image"],
  [/^(resources\.)?cpus$/, "cpus"],
  [/^(resources\.)?memory$/, "memory"],
  [/^(resources\.)?disk$/, "disk"],
  [/^ports($|[.[])/, "ports"],
  [/^(network\.)?ingress$/, "ingress"],
  [/^(network\.)?egress$/, "egress"],
  [/^persistent_disk$/, "persistentDisk"],
  [/^lifetime(_seconds)?$/, "lifetime"],
  [/^snapshot(_uuid)?$/, "snapshot"],
];

/** The field of the form a refusal is about, if the form shows that field. */
export function vmFieldOf(path: string): VmField | undefined {
  return API_FIELDS.find(([pattern]) => pattern.test(path))?.[1];
}

export function fieldErrorsFrom(errors?: Record<string, string> | null): {
  fields: Partial<Record<VmField, string>>;
  rest: string[];
} {
  const fields: Partial<Record<VmField, string>> = {};
  const rest: string[] = [];

  for (const [key, message] of Object.entries(errors ?? {})) {
    if (!message) {
      continue;
    }

    const field = vmFieldOf(key);
    if (field === undefined) {
      rest.push(message);
    } else if (fields[field] === undefined) {
      fields[field] = message;
    }
  }

  return {fields, rest};
}

function sameSize(a: Size, b: Size): boolean {
  return toBytes(a) === toBytes(b);
}

function samePorts(a: readonly number[], b: readonly number[]): boolean {
  const left = sortedPorts(a);
  const right = sortedPorts(b);

  return (
    left.length === right.length && left.every((port, i) => port === right[i])
  );
}
