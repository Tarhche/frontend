import {canCreateVms, vmAbilities, vmScope, vmSource} from "./permissions";

describe("what somebody may do to a VM", () => {
  it("asks about one's own through one's own routes", () => {
    expect(vmScope(["self.workload.vms.manage"], "manage", true)).toBe("mine");
  });

  it("asks about anybody's through the workload's routes", () => {
    expect(vmScope(["workload.vms.manage"], "manage", false)).toBe("all");
    expect(
      vmScope(
        ["workload.vms.manage", "self.workload.vms.manage"],
        "manage",
        false,
      ),
    ).toBe("all");
  });

  it("asks about one's own through the workload's when that is all one holds", () => {
    expect(vmScope(["workload.vms.delete"], "delete", true)).toBe("all");
  });

  it("does not ask about somebody else's on the strength of one's own", () => {
    expect(vmScope(["self.workload.vms.delete"], "delete", false)).toBe(null);
  });

  it("lets only the owner into a terminal, whatever else is held", () => {
    const admin = ["workload.vms.attach"];

    expect(vmAbilities(admin, false).attach).toBe(false);
    expect(vmAbilities(admin, true).attach).toBe(true);
    expect(vmAbilities(["self.workload.vms.attach"], true).attach).toBe(true);
  });

  it("takes snapshots only of one's own, under the workload's create", () => {
    const permissions = ["workload.snapshots.create"];

    expect(vmAbilities(permissions, true).snapshot).toBe(true);
    expect(vmAbilities(permissions, false).snapshot).toBe(false);
    expect(vmAbilities([], true).snapshot).toBe(false);
  });

  it("creates only under the workload's create", () => {
    expect(canCreateVms(["workload.vms.create"])).toBe(true);
    expect(canCreateVms(["self.workload.vms.index"])).toBe(false);
  });
});

describe("where VMs to pick from are listed", () => {
  it("lists everybody's through the workload's routes, for whoever may", () => {
    expect(vmSource(["workload.vms.index"], "all", "me")).toEqual({
      scope: "all",
    });
    expect(vmSource(["self.workload.vms.index"], "all", "me")).toBe(null);
  });

  it("lists one's own through one's own routes", () => {
    expect(
      vmSource(["workload.vms.index", "self.workload.vms.index"], "mine", "me"),
    ).toEqual({scope: "mine"});
  });

  it("narrows the workload's to one's own when that is all that is held", () => {
    expect(vmSource(["workload.vms.index"], "mine", "me")).toEqual({
      scope: "all",
      owner: "me",
    });
    expect(vmSource(["workload.vms.index"], "mine", null)).toBe(null);
  });

  it("lists nothing for somebody who may list neither", () => {
    expect(vmSource([], "mine", "me")).toBe(null);
  });
});
