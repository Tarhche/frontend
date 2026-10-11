import {dryRunDeleteVm} from "./client";

const mockDelete = jest.fn();

jest.mock("@/dal/client/client-dal-driver", () => ({
  clientDalDriver: {delete: (...args: unknown[]) => mockDelete(...args)},
}));

describe("what deleting a VM would do", () => {
  it("is its delete asked as a dry run, which says what needs it", async () => {
    mockDelete.mockResolvedValue({
      data: {
        dependents: [
          {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
        ],
        recreated: true,
      },
    });

    expect(await dryRunDeleteVm("mine", "vm-1")).toEqual({
      dependents: [{kind: "stack", uuid: "s-1", name: "shop", recreates: true}],
      recreated: true,
    });
    expect(mockDelete).toHaveBeenCalledWith("dashboard/my/workload/vms/vm-1", {
      params: {dry_run: true},
    });
  });

  it("is nothing needing it when nothing does", async () => {
    mockDelete.mockResolvedValue({data: {dependents: [], recreated: false}});

    expect(await dryRunDeleteVm("all", "vm-1")).toEqual({
      dependents: [],
      recreated: false,
    });
  });
});
