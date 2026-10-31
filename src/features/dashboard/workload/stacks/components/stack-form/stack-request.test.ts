import {dockerVm} from "@/features/dashboard/workload/docker/test-utils";
import {DOCKER_VM_DEFAULTS} from "@/features/dashboard/workload/docker/components/docker-vm-select/choice";
import {
  EXAMPLE_COMPOSE,
  FILE_KEYS,
  fileRefusals,
  isAboutTheFile,
  MAX_COMPOSE_BYTES,
  SERVICE_KEYS,
  stackRequest,
} from "./stack-request";

const compose = "services:\n  web:\n    image: nginx\n";
const inVm = {kind: "existing" as const, vm: dockerVm({uuid: "vm-1"})};

describe("stackRequest", () => {
  it("sends the compose file exactly as it was written", () => {
    const written = `${compose}\n# trailing comment\n`;
    const {body, errors} = stackRequest(
      {name: " shop ", compose: written},
      inVm,
    );

    expect(errors).toEqual({});
    expect(body).toEqual({vm_uuid: "vm-1", name: "shop", compose: written});
  });

  it("asks for a name and for a compose file", () => {
    expect(stackRequest({name: "", compose: "  \n"}, inVm).errors).toEqual({
      name: "required",
      compose: "required",
    });
  });

  it("refuses a compose file past what the platform takes", () => {
    const huge = `services:\n${"#".repeat(MAX_COMPOSE_BYTES)}`;

    expect(stackRequest({name: "big", compose: huge}, inVm).errors).toEqual({
      compose: "tooLarge",
    });
  });

  it("describes the Docker VM to create along with it", () => {
    const {body} = stackRequest(
      {name: "shop", compose},
      {kind: "new", vm: DOCKER_VM_DEFAULTS},
    );

    expect(body.vm_uuid).toBeUndefined();
    expect(body.vm).toMatchObject({name: "docker", ports: [80, 443, 8080]});
  });
});

describe("the example a stack starts from", () => {
  it("says nothing the platform does not take", () => {
    const taken: string[] = [...FILE_KEYS, ...SERVICE_KEYS];

    // the names of its services and its volume are keys too, which it chose.
    const named = ["web", "cache", "cache-data"];
    const said = EXAMPLE_COMPOSE.split("\n")
      .map((line) => /^\s*([a-z_-]+):/.exec(line)?.[1])
      .filter((key): key is string => key !== undefined)
      .filter((key) => !named.includes(key));

    expect(said.length).toBeGreaterThan(0);
    expect(said.filter((key) => !taken.includes(key))).toEqual([]);
  });

  it("has two services, one started after the other, a volume it declares, and restarts", () => {
    expect(EXAMPLE_COMPOSE).toMatch(/^services:\n {2}web:\n/);
    expect(EXAMPLE_COMPOSE).toMatch(/depends_on:\n {6}- cache\n/);
    expect(EXAMPLE_COMPOSE).toMatch(/- cache-data:\/data\n/);
    expect(EXAMPLE_COMPOSE).toMatch(/\nvolumes:\n {2}cache-data:\n$/);
    expect(EXAMPLE_COMPOSE.match(/restart: unless-stopped/g)).toHaveLength(2);
  });
});

describe("what is refused about a stack's file", () => {
  it("is what is said under compose, or under a path in it", () => {
    expect(isAboutTheFile("compose")).toBe(true);
    expect(isAboutTheFile("compose.services.web.build")).toBe(true);
    expect(isAboutTheFile("composed")).toBe(false);
    expect(isAboutTheFile("name")).toBe(false);
    expect(isAboutTheFile("vm.name")).toBe(false);
  });

  it("is said all at once, the file as a whole first, each where it is in the file", () => {
    expect(
      fileRefusals({
        "compose.services.web.ports[0]": "That is not a port.",
        name: "That name is taken.",
        compose: "A file can be up to 256 KiB.",
        "compose.services.web.build": "build is not supported.",
        vm_uuid: "That VM is not running.",
        "compose.services.web.depends_on.db": "There is no service db.",
      }),
    ).toEqual([
      {path: "", message: "A file can be up to 256 KiB."},
      {path: "services.web.build", message: "build is not supported."},
      {path: "services.web.depends_on.db", message: "There is no service db."},
      {path: "services.web.ports[0]", message: "That is not a port."},
    ]);
  });

  it("is nothing when nothing about the file was refused", () => {
    expect(fileRefusals({name: "That name is taken."})).toEqual([]);
  });
});
