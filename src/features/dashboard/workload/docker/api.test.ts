import {
  fetchNetworkDependents,
  fetchVolumeDependents,
  removeNetwork,
  removeVolume,
} from "./api";

const mockGet = jest.fn();
const mockDelete = jest.fn();

jest.mock("@/dal/client/client-dal-driver", () => ({
  clientDalDriver: {
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

const needed = {
  dependents: [{kind: "container", uuid: "c-1", name: "web", recreates: false}],
  recreated: false,
};

beforeEach(() => {
  mockGet.mockReset().mockResolvedValue({data: needed});
  mockDelete.mockReset().mockResolvedValue({data: ""});
});

describe("what needs a network or a volume", () => {
  it("is read, which removes nothing", async () => {
    expect(await fetchNetworkDependents("all", "vm-1", "backend")).toEqual(
      needed,
    );
    expect(mockGet).toHaveBeenLastCalledWith(
      "dashboard/workload/vms/vm-1/networks/backend/dependents",
    );

    expect(await fetchVolumeDependents("mine", "vm-1", "data")).toEqual(needed);
    expect(mockGet).toHaveBeenLastCalledWith(
      "dashboard/my/workload/vms/vm-1/volumes/data/dependents",
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("is nothing when nothing needs it", async () => {
    mockGet.mockResolvedValue({data: {dependents: [], recreated: false}});

    expect(await fetchVolumeDependents("mine", "vm-1", "data")).toEqual({
      dependents: [],
      recreated: false,
    });
  });
});

describe("removing a network", () => {
  it("asks for nothing but its removal, and is answered nothing needing it", async () => {
    expect(await removeNetwork("mine", "vm-1", "backend")).toEqual({
      dependents: [],
      recreated: false,
    });
    expect(mockDelete).toHaveBeenCalledWith(
      "dashboard/my/workload/vms/vm-1/networks/backend",
      {params: undefined},
    );
  });

  it("asks with what needs it when asked to, and says what does", async () => {
    mockDelete.mockResolvedValue({data: needed});

    expect(
      await removeNetwork("all", "vm-1", "backend", {cascade: true}),
    ).toEqual(needed);
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/workload/vms/vm-1/networks/backend",
      {params: {cascade: true}},
    );
  });
});

describe("removing a volume", () => {
  it("asks for force only when it is asked for", async () => {
    await removeVolume("mine", "vm-1", "data", false);
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/my/workload/vms/vm-1/volumes/data",
      {params: undefined},
    );

    await removeVolume("mine", "vm-1", "data", true);
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/my/workload/vms/vm-1/volumes/data",
      {params: {force: true}},
    );
  });

  it("asks with what needs it when asked to, force and all", async () => {
    await removeVolume("mine", "vm-1", "data", true, {cascade: true});
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/my/workload/vms/vm-1/volumes/data",
      {params: {force: true, cascade: true}},
    );
  });
});
