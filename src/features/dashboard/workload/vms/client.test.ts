import {getVmDependents} from "./client";

const mockGet = jest.fn();
const mockDelete = jest.fn();

jest.mock("@/dal/client/client-dal-driver", () => ({
  clientDalDriver: {
    get: (...args: unknown[]) => mockGet(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe("what needs a VM", () => {
  it("is read, which deletes nothing", async () => {
    mockGet.mockResolvedValue({
      data: {
        dependents: [
          {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
        ],
        recreated: true,
      },
    });

    expect(await getVmDependents("mine", "vm-1")).toEqual({
      dependents: [{kind: "stack", uuid: "s-1", name: "shop", recreates: true}],
      recreated: true,
    });
    expect(mockGet).toHaveBeenCalledWith(
      "dashboard/my/workload/vms/vm-1/dependents",
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("is nothing needing it when nothing does", async () => {
    mockGet.mockResolvedValue({data: {dependents: [], recreated: false}});

    expect(await getVmDependents("all", "vm-1")).toEqual({
      dependents: [],
      recreated: false,
    });
  });
});
