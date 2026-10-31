import {DALDriverError} from "@/dal/dal-driver-error";
import {deleteVm} from "./vm-commands";

const mockDelete = jest.fn();

jest.mock("@/dal/private/private-dal-driver", () => ({
  privateDalDriver: {delete: (...args: unknown[]) => mockDelete(...args)},
}));

jest.mock("next/cache", () => ({revalidatePath: jest.fn()}));

const shop = {kind: "stack", uuid: "s-1", name: "shop", recreates: true};

beforeEach(() => {
  mockDelete.mockReset();
});

describe("deleting a VM", () => {
  it("deletes it alone, and says what needs it and that it comes back", async () => {
    mockDelete.mockResolvedValue({data: {dependents: [shop], recreated: true}});

    expect(await deleteVm("vm-1", "mine")).toEqual({
      ok: true,
      removal: {dependents: [shop], recreated: true},
    });
    expect(mockDelete).toHaveBeenCalledWith("dashboard/my/workload/vms/vm-1", {
      params: undefined,
    });
  });

  it("deletes it together with what needs it when asked to", async () => {
    mockDelete.mockResolvedValue({
      data: {dependents: [shop], recreated: false},
    });

    expect(await deleteVm("vm-1", "all", {cascade: true})).toEqual({
      ok: true,
      removal: {dependents: [shop], recreated: false},
    });
    expect(mockDelete).toHaveBeenCalledWith("dashboard/workload/vms/vm-1", {
      params: {cascade: true},
    });
  });

  it("is nothing needing it when the answer says nothing", async () => {
    mockDelete.mockResolvedValue({data: ""});

    expect(await deleteVm("vm-1", "mine")).toEqual({
      ok: true,
      removal: {dependents: [], recreated: false},
    });
  });

  it("says why it was refused, with what needs it", async () => {
    mockDelete.mockRejectedValue(
      new DALDriverError("refused", 400, {
        data: {
          errors: {vm: "The VM is being restored."},
          dependents: [shop],
          recreated: true,
        },
      }),
    );

    expect(await deleteVm("vm-1", "mine")).toEqual({
      ok: false,
      problem: {
        status: 400,
        fields: {vm: "The VM is being restored."},
        dependents: [shop],
        recreated: true,
        unanswered: false,
      },
    });
  });

  it("asks nothing through routes that are not there", async () => {
    expect(await deleteVm("vm-1", "theirs" as never)).toMatchObject({
      ok: false,
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
