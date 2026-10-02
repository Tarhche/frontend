import {
  capabilitiesOf,
  composeSize,
  initialRuntime,
  refusalOf,
  runtimeOf,
  within,
  type Runtime,
} from "./runtimes";

const sysbox: Runtime = {
  class: "sysbox",
  default: true,
  available: true,
  nodes: 3,
  capabilities: {stack_networks: true, network_policies: ["isolated"]},
};

const firecracker: Runtime = {
  class: "firecracker",
  default: false,
  available: true,
  nodes: 1,
  capabilities: {stack_networks: false},
};

const down = (runtime: Runtime): Runtime => ({
  ...runtime,
  available: false,
  nodes: 0,
});

describe("runtimeOf", () => {
  it("takes a task that names no class for one run as a container", () => {
    expect(runtimeOf(undefined)).toBe("sysbox");
    expect(runtimeOf("")).toBe("sysbox");
    expect(runtimeOf("firecracker")).toBe("firecracker");
  });
});

describe("refusalOf", () => {
  it("refuses a class no node can run right now", () => {
    expect(refusalOf(down(firecracker))).toBe("unavailable");
    expect(refusalOf(firecracker)).toBeUndefined();
  });

  it("refuses a stack a class that cannot give its services a network", () => {
    expect(refusalOf(firecracker, {stack: true})).toBe("noStackNetworks");
    expect(refusalOf(sysbox, {stack: true})).toBeUndefined();
  });
});

describe("initialRuntime", () => {
  it("starts on the default, wherever the workload lists it", () => {
    expect(initialRuntime([firecracker, sysbox])).toBe("sysbox");
  });

  it("starts on the first that can be chosen when the default cannot", () => {
    expect(initialRuntime([down(sysbox), firecracker])).toBe("firecracker");
  });

  it("still shows the default when nothing can be chosen", () => {
    expect(initialRuntime([down(firecracker), down(sysbox)])).toBe("sysbox");
  });

  it("starts a stack on a class that can run one", () => {
    const vmByDefault = {...firecracker, default: true};
    const notDefault = {...sysbox, default: false};

    expect(initialRuntime([vmByDefault, notDefault], {stack: true})).toBe(
      "sysbox",
    );
  });

  it("has nothing to start on when nothing is offered", () => {
    expect(initialRuntime([])).toBeUndefined();
  });
});

describe("capabilitiesOf", () => {
  it("says what the chosen class can do", () => {
    expect(capabilitiesOf([sysbox], "sysbox")).toBe(sysbox.capabilities);
  });

  it("restricts nothing for a class no node runs, nor for no class", () => {
    expect(capabilitiesOf([down(sysbox)], "sysbox")).toBeUndefined();
    expect(capabilitiesOf(null, "sysbox")).toBeUndefined();
    expect(capabilitiesOf([sysbox], undefined)).toBeUndefined();
  });
});

describe("within", () => {
  const fallback = ["isolated", "none", "public"];

  it("keeps what was chosen when the class allows it", () => {
    expect(within("public", ["none", "public"], fallback)).toBe("public");
  });

  it("falls back to the first of what is preferred that the class allows", () => {
    expect(within("public", ["none", "isolated"], fallback)).toBe("isolated");
    expect(within("public", ["none"], fallback)).toBe("none");
  });

  it("takes a class that lists nothing as allowing everything", () => {
    expect(within("public", undefined, fallback)).toBe("public");
    expect(within("public", [], fallback)).toBe("public");
  });
});

describe("composeSize", () => {
  it("writes a size the way the memory field takes one", () => {
    expect(composeSize(128 * 1024 ** 2)).toBe("128M");
    expect(composeSize(2 * 1024 ** 3)).toBe("2G");
    expect(composeSize(1536 * 1024 ** 2)).toBe("1536M");
    expect(composeSize(512 * 1024)).toBe("512K");
    expect(composeSize(1000)).toBe("1000b");
  });
});
