import {dockerVm} from "@/features/dashboard/workload/docker/test-utils";
import {DOCKER_VM_DEFAULTS} from "@/features/dashboard/workload/docker/components/docker-vm-select/choice";
import {MAX_COMPOSE_BYTES, stackRequest} from "./stack-request";

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
