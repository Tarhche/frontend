import {GiB, MiB} from "@/features/dashboard/workload/vms/lib/units";
import {dockerVm} from "../../test-utils";
import {DOCKER_VM_DEFAULTS} from "../docker-vm-select/choice";
import {
  containerRequest,
  emptyContainer,
  reachability,
  type ContainerValues,
} from "./container-request";

const inVm = {kind: "existing" as const, vm: dockerVm({uuid: "vm-1"})};

function written(values: Partial<ContainerValues>): ContainerValues {
  return {...emptyContainer(), image: "nginx:1.27-alpine", ...values};
}

describe("containerRequest", () => {
  it("sends what was written, and nothing that was not", () => {
    const {body, errors} = containerRequest(written({}), inVm);

    expect(errors).toEqual({});
    expect(JSON.parse(JSON.stringify(body))).toEqual({
      vm_uuid: "vm-1",
      image: "nginx:1.27-alpine",
      restart_policy: "unless-stopped",
    });
  });

  it("writes the environment as KEY=value, dropping the rows left blank", () => {
    const {body, errors} = containerRequest(
      written({
        env: [
          {id: "a", key: "MODE", value: "production"},
          {id: "b", key: "", value: ""},
          {id: "c", key: "GREETING", value: "hello = world"},
        ],
      }),
      inVm,
    );

    expect(errors).toEqual({});
    expect(body.env).toEqual(["MODE=production", "GREETING=hello = world"]);
  });

  it("refuses a variable with no name, or with a space or an = in it", () => {
    const {errors} = containerRequest(
      written({
        env: [
          {id: "a", key: "", value: "orphan"},
          {id: "b", key: "A B", value: "x"},
          {id: "c", key: "A=B", value: "x"},
        ],
      }),
      inVm,
    );

    expect(errors).toEqual({
      "env.0": "envKey",
      "env.1": "envKey",
      "env.2": "envKey",
    });
  });

  it("publishes a port on the same port of the VM unless told otherwise", () => {
    const {body} = containerRequest(
      written({
        ports: [
          {id: "a", containerPort: "80", hostPort: "", protocol: "tcp"},
          {id: "b", containerPort: "53", hostPort: "5353", protocol: "udp"},
        ],
      }),
      inVm,
    );

    expect(body.ports).toEqual([
      {container_port: 80, host_port: 80, protocol: "tcp"},
      {container_port: 53, host_port: 5353, protocol: "udp"},
    ]);
  });

  it("refuses what is not a port, and a host port published twice", () => {
    const {errors} = containerRequest(
      written({
        ports: [
          {id: "a", containerPort: "http", hostPort: "", protocol: "tcp"},
          {id: "b", containerPort: "80", hostPort: "99999", protocol: "tcp"},
          {id: "c", containerPort: "80", hostPort: "8080", protocol: "tcp"},
          {id: "d", containerPort: "81", hostPort: "8080", protocol: "tcp"},
          {id: "e", containerPort: "81", hostPort: "8080", protocol: "udp"},
        ],
      }),
      inVm,
    );

    expect(errors).toEqual({
      "ports.0.container_port": "notAPort",
      "ports.1.host_port": "notAPort",
      "ports.3.host_port": "duplicatePort",
    });
  });

  it("mounts volumes and paths of the VM where they were asked to go", () => {
    const {body, errors} = containerRequest(
      written({
        mounts: [
          {
            id: "a",
            type: "volume",
            source: "data",
            target: "/var/lib/data",
            readOnly: false,
          },
          {
            id: "b",
            type: "bind",
            source: "/srv/config",
            target: "/etc/app",
            readOnly: true,
          },
          {id: "c", type: "volume", source: "", target: "", readOnly: false},
        ],
      }),
      inVm,
    );

    expect(errors).toEqual({});
    expect(body.mounts).toEqual([
      {
        type: "volume",
        source: "data",
        target: "/var/lib/data",
        read_only: false,
      },
      {
        type: "bind",
        source: "/srv/config",
        target: "/etc/app",
        read_only: true,
      },
    ]);
  });

  it("refuses a mount that does not say where, or binds a relative path", () => {
    const {errors} = containerRequest(
      written({
        mounts: [
          {
            id: "a",
            type: "volume",
            source: "data",
            target: "data",
            readOnly: false,
          },
          {
            id: "b",
            type: "bind",
            source: "srv",
            target: "/srv",
            readOnly: false,
          },
        ],
      }),
      inVm,
    );

    expect(errors).toEqual({
      "mounts.0.target": "absolutePath",
      "mounts.1.source": "absolutePath",
    });
  });

  it("splits a command into its arguments and keeps the sizes in bytes", () => {
    const {body} = containerRequest(
      written({
        command: `sh -c "echo hi && sleep 1"`,
        entrypoint: "/docker-entrypoint.sh",
        cpus: 0.5,
        memory: {amount: 256, unit: "MiB"},
      }),
      inVm,
    );

    expect(body.command).toEqual(["sh", "-c", "echo hi && sleep 1"]);
    expect(body.entrypoint).toEqual(["/docker-entrypoint.sh"]);
    expect(body.cpus).toBe(0.5);
    expect(body.memory).toBe(256 * MiB);
  });

  it("asks for an image, and for quotes that are closed", () => {
    const {errors} = containerRequest(
      written({image: " ", command: `echo "hi`}),
      inVm,
    );

    expect(errors).toEqual({image: "required", command: "unterminatedQuote"});
  });

  it("describes the Docker VM to create along with it", () => {
    const {body} = containerRequest(written({}), {
      kind: "new",
      vm: DOCKER_VM_DEFAULTS,
    });

    expect(body.vm_uuid).toBeUndefined();
    expect(body.vm).toEqual({
      name: "docker",
      resources: {cpus: 2, memory: 2 * GiB, disk: 20 * GiB},
      ports: [80, 443, 8080],
      network: {ingress: "allow", egress: "allow"},
    });
  });
});

describe("reachability", () => {
  const port = (host_port: number) => ({
    container_port: 80,
    host_port,
    protocol: "tcp" as const,
  });

  it("says nothing of ports the VM exposes", () => {
    expect(reachability([port(80), port(8080)], inVm)).toBeNull();
  });

  it("names the host ports the VM does not expose", () => {
    expect(reachability([port(80), port(3000), port(5432)], inVm)).toEqual({
      ingressDenied: false,
      unreachable: [3000, 5432],
      exposed: [80, 443, 8080],
    });
  });

  it("says nothing is reachable in a VM that lets nothing in", () => {
    const closed = {
      kind: "existing" as const,
      vm: dockerVm({network: {ingress: "deny", egress: "allow"}}),
    };

    expect(reachability([port(80)], closed)).toMatchObject({
      ingressDenied: true,
      unreachable: [80],
    });
  });

  it("reads a new VM's ports as they are being edited", () => {
    const fresh = {
      kind: "new" as const,
      vm: {...DOCKER_VM_DEFAULTS, ports: [3000]},
    };

    expect(reachability([port(3000)], fresh)).toBeNull();
    expect(reachability([port(80)], fresh)?.unreachable).toEqual([80]);
  });

  it("says nothing before the VM is known", () => {
    expect(reachability([port(3000)], {kind: "unset"})).toBeNull();
  });
});
