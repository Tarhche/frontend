import {
  capabilitiesOf,
  composeSize,
  initialRuntime,
  refusalOf,
  runtimeHint,
  runtimeName,
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

const other: Runtime = {
  class: "other",
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

describe("refusalOf", () => {
  it("refuses a class no node can run right now", () => {
    expect(refusalOf(down(other))).toBe("unavailable");
    expect(refusalOf(other)).toBeUndefined();
  });

  it("refuses a stack a class that cannot give its services a network", () => {
    expect(refusalOf(other, {stack: true})).toBe("noStackNetworks");
    expect(refusalOf(sysbox, {stack: true})).toBeUndefined();
  });
});

describe("initialRuntime", () => {
  it("starts on the default, wherever the workload lists it", () => {
    expect(initialRuntime([other, sysbox])).toBe("sysbox");
  });

  it("starts on the first that can be chosen when the default cannot", () => {
    expect(initialRuntime([down(sysbox), other])).toBe("other");
  });

  it("still shows the default when nothing can be chosen", () => {
    expect(initialRuntime([down(other), down(sysbox)])).toBe("sysbox");
  });

  it("starts a stack on a class that can run one", () => {
    const otherByDefault = {...other, default: true};
    const notDefault = {...sysbox, default: false};

    expect(initialRuntime([otherByDefault, notDefault], {stack: true})).toBe(
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

describe("runtimeName", () => {
  const words: Record<string, string> = {
    "tasks.runtime.classes.sysbox": "Container (sysbox)",
  };
  const t = (key: string) => words[key] ?? key;

  it("calls a class what the reader's language calls it", () => {
    expect(runtimeName(t, "sysbox")).toBe("Container (sysbox)");
  });

  it("calls a class nobody has named yet what the workload calls it", () => {
    expect(runtimeName(t, "other")).toBe("other");
  });
});

describe("runtimeHint", () => {
  const words: Record<string, string> = {
    "tasks.runtime.hints.container": "Shares the host kernel.",
    "tasks.runtime.hints.microvm": "Its own kernel.",
  };
  const t = (key: string) => words[key] ?? key;

  const isolated = (isolation?: string): Runtime => ({
    ...other,
    capabilities: {...other.capabilities, isolation},
  });

  it("says what a class is by how it keeps tasks apart, whatever it is called", () => {
    expect(runtimeHint(t, isolated("container"))).toBe(
      "Shares the host kernel.",
    );
    expect(runtimeHint(t, isolated("microvm"))).toBe("Its own kernel.");
  });

  it("says nothing of a class that does not say how, nor of a way there are no words for", () => {
    expect(runtimeHint(t, isolated(undefined))).toBeUndefined();
    expect(runtimeHint(t, isolated(""))).toBeUndefined();
    expect(runtimeHint(t, {...other, capabilities: undefined})).toBeUndefined();
    expect(runtimeHint(t, isolated("unheard-of"))).toBeUndefined();
  });
});
