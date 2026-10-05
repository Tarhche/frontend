import {
  createVmPath,
  vmCommandPath,
  vmLogsPath,
  vmPath,
  vmRestorePath,
  vmsPath,
} from "./api";

describe("where VMs are asked about", () => {
  it("is the workload's routes for anybody's, and one's own for one's own", () => {
    expect(vmsPath("all")).toBe("dashboard/workload/vms");
    expect(vmsPath("mine")).toBe("dashboard/my/workload/vms");
    expect(vmPath("mine", "a b")).toBe("dashboard/my/workload/vms/a%20b");
  });

  it("is the workload's own route for creating, whoever asks", () => {
    expect(createVmPath()).toBe("dashboard/workload/vms");
  });

  it("has a route of its own for each thing asked of one", () => {
    expect(vmCommandPath("all", "v", "restart")).toBe(
      "dashboard/workload/vms/v/restart",
    );
    expect(vmRestorePath("mine", "v")).toBe(
      "dashboard/my/workload/vms/v/restore",
    );
    expect(vmLogsPath("mine", "v")).toBe("dashboard/my/workload/vms/v/logs");
  });
});
