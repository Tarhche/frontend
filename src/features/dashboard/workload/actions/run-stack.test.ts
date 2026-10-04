import {DALDriverError} from "@/dal/dal-driver-error";
import {runStack} from "./run-stack";

const post = jest.fn();
const redirect = jest.fn();

// what is sent is the subject here; the backend, the cache and the navigation
// that follow a stack being run are not.
jest.mock("@/dal/private/private-dal-driver", () => ({
  privateDalDriver: {post: (...args: unknown[]) => post(...args)},
}));

jest.mock("next/cache", () => ({revalidatePath: jest.fn()}));

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
  unstable_rethrow: jest.fn(),
}));

const services = {
  web: {image: "nginx:1.27-alpine", ports: ["80"]},
  api: {image: "hashicorp/http-echo", runtime: "other"},
};

/** A form as the stack form submits it, with whatever is given on top. */
function form(fields: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set("name", "shop");
  data.set("services", JSON.stringify(services));

  for (const [name, value] of Object.entries(fields)) {
    data.set(name, value);
  }

  return data;
}

/** What reached the backend, as it went over the wire. */
function sent(): Record<string, unknown> {
  expect(post).toHaveBeenCalledTimes(1);
  const [path, body] = post.mock.calls[0];
  expect(path).toBe("/dashboard/workload/stacks");

  return JSON.parse(JSON.stringify(body));
}

beforeEach(() => {
  post.mockReset();
  redirect.mockReset();
  post.mockResolvedValue({data: {}});
});

describe("runStack", () => {
  it("asks for the class that was chosen for the whole stack", async () => {
    await runStack({}, form({runtime: "other"}));

    expect(sent()).toEqual({name: "shop", runtime: "other", services});
    expect(redirect).toHaveBeenCalledWith("/dashboard/stacks");
  });

  it("leaves the services as they were written", async () => {
    await runStack({}, form({runtime: "sysbox"}));

    // a service that names a class of its own keeps it, and one that names
    // none is the workload's to fill in, not the form's.
    expect(sent().services).toEqual(services);
  });

  it("asks for no class when the form offered none to choose", async () => {
    await runStack({}, form());

    expect(sent()).not.toHaveProperty("runtime");
  });

  it("says when the services would be run as more than one class", async () => {
    post.mockRejectedValue(
      new DALDriverError("Bad Request", 400, {
        data: {errors: {runtime: "mixed_runtimes_in_stack"}},
      }),
    );

    await expect(runStack({}, form({runtime: "sysbox"}))).resolves.toEqual({
      errors: {runtime: "mixed_runtimes_in_stack"},
      values: {name: "shop", services: JSON.stringify(services)},
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
