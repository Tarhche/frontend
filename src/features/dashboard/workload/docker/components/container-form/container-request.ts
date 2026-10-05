import {MiB} from "@/features/dashboard/workload/vms/lib/units";
import {portNumber, shellWords} from "../../format";
import {
  type ContainerCreateRequest,
  type Mount,
  type PortBinding,
  type Protocol,
  type RestartPolicy,
} from "../../types";
import {vmTarget, type VmChoice} from "../docker-vm-select/choice";

let lastRow = 0;

/** A key for a row somebody added, which the page keeps it by. */
export function rowId(): string {
  lastRow += 1;

  return `row-${lastRow}`;
}

export type EnvRow = {id: string; key: string; value: string};

export type PortRow = {
  id: string;
  containerPort: string;
  hostPort: string;
  protocol: Protocol;
};

export type MountRow = {
  id: string;
  type: "volume" | "bind";
  source: string;
  target: string;
  readOnly: boolean;
};

/** A container as somebody is writing it down, before it is a request. */
export type ContainerValues = {
  image: string;
  name: string;
  command: string;
  entrypoint: string;
  workingDir: string;
  env: EnvRow[];
  ports: PortRow[];
  mounts: MountRow[];
  networks: string[];
  restartPolicy: RestartPolicy;
  cpus: number | "";
  memoryMiB: number | "";
};

export function emptyContainer(): ContainerValues {
  return {
    image: "",
    name: "",
    command: "",
    entrypoint: "",
    workingDir: "",
    env: [],
    ports: [],
    mounts: [],
    networks: [],
    restartPolicy: "unless-stopped",
    cpus: "",
    memoryMiB: "",
  };
}

/**
 * What is wrong with what was written, by field, as the words' keys:
 *
 * - required: there is nothing where something has to be;
 * - unterminatedQuote: a quote in a command was left open;
 * - envKey: a variable with no name, or a name with a space or an = in it;
 * - notAPort: a port that is not a number from 1 to 65535;
 * - duplicatePort: a host port published twice;
 * - absolutePath: a path in the VM or the container that does not start at /.
 */
export type ContainerErrors = Record<string, string>;

/**
 * The request for what was written, and what is wrong with it.
 *
 * Rows somebody added and left blank are not anything, and are dropped. A host
 * port left empty publishes the container port on the same port of the VM,
 * which is what somebody exposing 80 means; a command is split the way a shell
 * would, since docker takes it as its arguments.
 */
export function containerRequest(
  values: ContainerValues,
  choice: VmChoice,
): {body: ContainerCreateRequest; errors: ContainerErrors} {
  const errors: ContainerErrors = {};

  const image = values.image.trim();
  if (image.length === 0) {
    errors.image = "required";
  }

  const command = shellWords(values.command);
  if (command.unterminated) {
    errors.command = "unterminatedQuote";
  }

  const entrypoint = shellWords(values.entrypoint);
  if (entrypoint.unterminated) {
    errors.entrypoint = "unterminatedQuote";
  }

  const env: string[] = [];
  values.env.forEach((row, index) => {
    const key = row.key.trim();
    if (key.length === 0 && row.value.length === 0) {
      return;
    }

    if (key.length === 0 || /[\s=]/.test(key)) {
      errors[`env.${index}`] = "envKey";

      return;
    }

    env.push(`${key}=${row.value}`);
  });

  const ports: PortBinding[] = [];
  const published = new Set<string>();
  values.ports.forEach((row, index) => {
    const containerSide = row.containerPort.trim();
    const hostSide = row.hostPort.trim();
    if (containerSide.length === 0 && hostSide.length === 0) {
      return;
    }

    const containerPort = portNumber(containerSide);
    if (containerPort === null) {
      errors[`ports.${index}.container_port`] = "notAPort";

      return;
    }

    const hostPort =
      hostSide.length === 0 ? containerPort : portNumber(hostSide);
    if (hostPort === null) {
      errors[`ports.${index}.host_port`] = "notAPort";

      return;
    }

    const binding = `${hostPort}/${row.protocol}`;
    if (published.has(binding)) {
      errors[`ports.${index}.host_port`] = "duplicatePort";

      return;
    }

    published.add(binding);
    ports.push({
      container_port: containerPort,
      host_port: hostPort,
      protocol: row.protocol,
    });
  });

  const mounts: Mount[] = [];
  values.mounts.forEach((row, index) => {
    const source = row.source.trim();
    const target = row.target.trim();
    if (source.length === 0 && target.length === 0) {
      return;
    }

    if (!target.startsWith("/")) {
      errors[`mounts.${index}.target`] = "absolutePath";

      return;
    }

    // a volume with no name is one docker makes up; a bind has to say what of
    // the VM it binds.
    if (row.type === "bind" && !source.startsWith("/")) {
      errors[`mounts.${index}.source`] = "absolutePath";

      return;
    }

    mounts.push({type: row.type, source, target, read_only: row.readOnly});
  });

  const body: ContainerCreateRequest = {
    ...vmTarget(choice),
    name: values.name.trim() || undefined,
    image,
    command: command.words.length > 0 ? command.words : undefined,
    entrypoint: entrypoint.words.length > 0 ? entrypoint.words : undefined,
    env: env.length > 0 ? env : undefined,
    working_dir: values.workingDir.trim() || undefined,
    ports: ports.length > 0 ? ports : undefined,
    mounts: mounts.length > 0 ? mounts : undefined,
    networks: values.networks.length > 0 ? values.networks : undefined,
    restart_policy: values.restartPolicy,
    cpus: values.cpus === "" ? undefined : values.cpus,
    memory:
      values.memoryMiB === "" ? undefined : Math.round(values.memoryMiB * MiB),
  };

  return {body, errors};
}

/** Which of a container's published ports the outside world cannot reach. */
export type Reachability = {
  /** the VM lets nothing in at all. */
  ingressDenied: boolean;
  unreachable: number[];

  /** the VM ports the ingress does serve. */
  exposed: number[];
};

/**
 * Whether what a container publishes can be reached from outside its VM.
 *
 * A container port is published on a port of the VM, and the ingress serves
 * only the VM's exposed ports, and only when the VM lets anything in: a port
 * published anywhere else is there, but only for whatever is inside the VM.
 * Nothing is said about a VM that is not known yet.
 */
export function reachability(
  ports: PortBinding[],
  choice: VmChoice,
): Reachability | null {
  if (ports.length === 0 || choice.kind === "unset") {
    return null;
  }

  const exposed =
    choice.kind === "existing" ? (choice.vm.ports ?? []) : choice.vm.ports;
  const ingress =
    choice.kind === "existing"
      ? (choice.vm.network?.ingress ?? "allow") === "allow"
      : choice.vm.ingress;

  const hostPorts = [...new Set(ports.map((port) => port.host_port))].sort(
    (a, b) => a - b,
  );

  if (!ingress) {
    return {ingressDenied: true, unreachable: hostPorts, exposed};
  }

  const unreachable = hostPorts.filter((port) => !exposed.includes(port));

  return unreachable.length > 0
    ? {ingressDenied: false, unreachable, exposed}
    : null;
}
