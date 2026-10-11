import {removeNetwork, removeVolume} from "./api";

const mockDelete = jest.fn();

jest.mock("@/dal/client/client-dal-driver", () => ({
  clientDalDriver: {delete: (...args: unknown[]) => mockDelete(...args)},
}));

const needed = {
  dependents: [{kind: "container", uuid: "c-1", name: "web", recreates: false}],
  recreated: false,
};

beforeEach(() => {
  mockDelete.mockReset().mockResolvedValue({data: ""});
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

  it("asks a dry run, or with what needs it, and says what does", async () => {
    mockDelete.mockResolvedValue({data: needed});

    expect(
      await removeNetwork("all", "vm-1", "backend", {dryRun: true}),
    ).toEqual(needed);
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/workload/vms/vm-1/networks/backend",
      {params: {dry_run: true}},
    );

    await removeNetwork("all", "vm-1", "backend", {cascade: true});
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

  it("asks its dry run with the force it would be removed with", async () => {
    mockDelete.mockResolvedValue({data: needed});

    expect(
      await removeVolume("mine", "vm-1", "data", true, {dryRun: true}),
    ).toEqual(needed);
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/my/workload/vms/vm-1/volumes/data",
      {params: {force: true, dry_run: true}},
    );

    await removeVolume("mine", "vm-1", "data", false, {cascade: true});
    expect(mockDelete).toHaveBeenLastCalledWith(
      "dashboard/my/workload/vms/vm-1/volumes/data",
      {params: {cascade: true}},
    );
  });
});
