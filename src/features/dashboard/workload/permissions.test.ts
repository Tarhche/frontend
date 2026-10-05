import {readScope, scopeFor} from "./permissions";

describe("what somebody may do with the workload's things", () => {
  it("asks about one's own through one's own routes", () => {
    expect(
      scopeFor(
        ["self.workload.containers.manage"],
        "containers",
        "manage",
        true,
      ),
    ).toBe("mine");
  });

  it("asks about anybody's through the workload's routes", () => {
    const both = ["workload.stacks.delete", "self.workload.stacks.delete"];

    expect(scopeFor(both, "stacks", "delete", false)).toBe("all");
    expect(scopeFor(both, "stacks", "delete", true)).toBe("mine");
  });

  it("asks about one's own through the workload's when that is all one holds", () => {
    expect(
      scopeFor(["workload.containers.delete"], "containers", "delete", true),
    ).toBe("all");
  });

  it("does not ask about somebody else's on the strength of one's own", () => {
    expect(
      scopeFor(
        ["self.workload.snapshots.update"],
        "snapshots",
        "update",
        false,
      ),
    ).toBe(null);
  });

  it("reads one thing as anybody's for whoever may see anybody's", () => {
    expect(readScope(["workload.stacks.show"], "stacks")).toBe("all");
    expect(readScope(["self.workload.stacks.show"], "stacks")).toBe("mine");
  });
});
