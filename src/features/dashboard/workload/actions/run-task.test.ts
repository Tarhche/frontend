import {DALDriverError} from "@/dal/dal-driver-error";
import {runTask} from "./run-task";

const post = jest.fn();
const redirect = jest.fn();

// what is sent is the subject here; the backend, the cache and the navigation
// that follow a task being run are not.
jest.mock("@/dal/private/private-dal-driver", () => ({
  privateDalDriver: {post: (...args: unknown[]) => post(...args)},
}));

jest.mock("next/cache", () => ({revalidatePath: jest.fn()}));

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
  unstable_rethrow: jest.fn(),
}));

/** A form as the task form submits it, with whatever is given on top. */
function form(fields: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set("name", "web");
  data.set("image", "nginx:1.27-alpine");
  data.set("network_mode", "isolated");
  data.set("restart", "unless-stopped");
  data.set("cpus", "0.5");
  data.set("memory", "256M");

  for (const [name, value] of Object.entries(fields)) {
    data.set(name, value);
  }

  return data;
}

/** What reached the backend, as it went over the wire. */
function sent(): Record<string, unknown> {
  expect(post).toHaveBeenCalledTimes(1);
  const [path, body] = post.mock.calls[0];
  expect(path).toBe("/dashboard/workload/tasks");

  return JSON.parse(JSON.stringify(body));
}

beforeEach(() => {
  post.mockReset();
  redirect.mockReset();
  post.mockResolvedValue({data: {}});
});

describe("runTask", () => {
  it("asks for the class that was chosen", async () => {
    await runTask({}, form({runtime: "other"}));

    expect(sent()).toMatchObject({
      name: "web",
      image: "nginx:1.27-alpine",
      runtime: "other",
    });
    expect(redirect).toHaveBeenCalledWith("/dashboard/tasks");
  });

  it("asks for no class when the form offered none to choose", async () => {
    await runTask({}, form());

    expect(sent()).not.toHaveProperty("runtime");
  });

  it("takes an empty choice for no choice", async () => {
    await runTask({}, form({runtime: ""}));

    expect(sent()).not.toHaveProperty("runtime");
  });

  it("says what the workload refused about the class", async () => {
    post.mockRejectedValue(
      new DALDriverError("Bad Request", 400, {
        data: {errors: {runtime: "invalid_value"}},
      }),
    );

    await expect(runTask({}, form({runtime: "gvisor"}))).resolves.toEqual({
      errors: {runtime: "invalid_value"},
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
