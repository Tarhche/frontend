import {notFound} from "next/navigation";
import {DALDriverError} from "@/dal/dal-driver-error";
import {loadRuntimes} from "./load-runtimes";

const fetchRuntimes = jest.fn();
const fetchMyRuntimes = jest.fn();

jest.mock("@/dal/private/workload", () => ({
  fetchRuntimes: () => fetchRuntimes(),
  fetchMyRuntimes: () => fetchMyRuntimes(),
}));

const sysbox = {
  class: "sysbox",
  default: true,
  available: true,
  nodes: 3,
  capabilities: {
    isolation: "container",
    network_policies: ["none", "isolated", "public"],
    stack_networks: true,
    read_only_root: true,
  },
  capacity: {cpu: 8, allocated_cpu: 1.5, reserved: false},
};

const other = {
  class: "other",
  default: false,
  available: false,
  nodes: 0,
};

/**
 * What the DAL throws for a 403: forbidden(), which travels as an error
 * carrying a digest, the way notFound() does for a 404.
 */
function forbiddenThrown(): Error {
  return Object.assign(new Error("NEXT_HTTP_ERROR_FALLBACK;403"), {
    digest: "NEXT_HTTP_ERROR_FALLBACK;403",
  });
}

beforeEach(() => {
  fetchRuntimes.mockReset();
  fetchMyRuntimes.mockReset();
});

describe("loadRuntimes", () => {
  it("offers what the workload says a task can be run as", async () => {
    fetchRuntimes.mockResolvedValue({items: [sysbox, other]});

    await expect(loadRuntimes(false)).resolves.toEqual([sysbox, other]);
    expect(fetchMyRuntimes).not.toHaveBeenCalled();
  });

  it("asks as somebody trusted with only their own tasks", async () => {
    fetchMyRuntimes.mockResolvedValue({items: [sysbox]});

    await expect(loadRuntimes(true)).resolves.toEqual([sysbox]);
    expect(fetchRuntimes).not.toHaveBeenCalled();
  });

  it("offers nothing while the backend does not serve runtimes", async () => {
    // which is what the DAL does with a 404
    fetchRuntimes.mockImplementation(async () => notFound());

    await expect(loadRuntimes(false)).resolves.toBeNull();
  });

  it("offers nothing to somebody it will not tell", async () => {
    fetchMyRuntimes.mockRejectedValue(forbiddenThrown());

    await expect(loadRuntimes(true)).resolves.toBeNull();
  });

  it("offers nothing when the backend fails", async () => {
    fetchRuntimes.mockRejectedValue(
      new DALDriverError("Internal Server Error", 500, {data: {}}),
    );

    await expect(loadRuntimes(false)).resolves.toBeNull();
  });

  it("offers nothing when it is told of nothing it can use", async () => {
    fetchRuntimes.mockResolvedValueOnce({items: []});
    await expect(loadRuntimes(false)).resolves.toBeNull();

    fetchRuntimes.mockResolvedValueOnce({});
    await expect(loadRuntimes(false)).resolves.toBeNull();

    fetchRuntimes.mockResolvedValueOnce("<html>not json</html>");
    await expect(loadRuntimes(false)).resolves.toBeNull();

    fetchRuntimes.mockResolvedValueOnce({items: [{}, {class: ""}, null]});
    await expect(loadRuntimes(false)).resolves.toBeNull();
  });

  it("leaves out what does not say which class it is", async () => {
    fetchRuntimes.mockResolvedValue({items: [{nodes: 1}, sysbox]});

    await expect(loadRuntimes(false)).resolves.toEqual([sysbox]);
  });
});
