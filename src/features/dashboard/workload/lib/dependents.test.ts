import {
  dependentHref,
  dependentsOf,
  NOTHING_NEEDS_IT,
  removalOf,
  removeParams,
} from "./dependents";

describe("what a delete of something others need is answered with", () => {
  it("is what needs it, and whether any of it makes it again", () => {
    expect(
      removalOf({
        dependents: [
          {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
          {kind: "container", uuid: "c-1", name: "web", recreates: false},
        ],
        recreated: true,
      }),
    ).toEqual({
      dependents: [
        {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
        {kind: "container", uuid: "c-1", name: "web", recreates: false},
      ],
      recreated: true,
    });
  });

  it("is nothing needing it when nothing does, or nothing was said", () => {
    expect(removalOf({dependents: [], recreated: false})).toEqual(
      NOTHING_NEEDS_IT,
    );
    expect(removalOf("")).toEqual(NOTHING_NEEDS_IT);
    expect(removalOf(undefined)).toEqual(NOTHING_NEEDS_IT);
  });

  it("does not say it comes back when nothing is said to need it", () => {
    expect(removalOf({dependents: [], recreated: true}).recreated).toBe(false);
  });

  it("keeps only what says what it is and which one", () => {
    expect(
      dependentsOf([
        {kind: "container", uuid: "c-1"},
        {kind: "container"},
        {uuid: "c-2", name: "orphan"},
        {kind: "stack", uuid: "", name: "nameless"},
        "c-3",
        null,
      ]),
    ).toEqual([{kind: "container", uuid: "c-1", recreates: false}]);
    expect(dependentsOf("stack")).toEqual([]);
  });
});

describe("the query a delete is asked with", () => {
  it("asks for only what it asks for", () => {
    expect(removeParams({})).toBeUndefined();
    expect(removeParams({force: false, cascade: false})).toBeUndefined();
    expect(removeParams({cascade: true})).toEqual({cascade: true});
    expect(removeParams({cascade: true, force: true})).toEqual({
      force: true,
      cascade: true,
    });
  });
});

describe("where what needs something is looked at", () => {
  const everything = {stacks: true, containers: true};
  const stack = {kind: "stack", uuid: "s-1", recreates: true};
  const container = {kind: "container", uuid: "c-1", recreates: false};

  it("is a stack's page, or a container's by its uuid in its VM", () => {
    expect(dependentHref(stack, "vm-1", everything)).toBe(
      "/dashboard/stacks/s-1",
    );
    expect(dependentHref(container, "vm-1", everything)).toBe(
      "/dashboard/containers/vm-1/c-1",
    );
  });

  it("is nowhere for whoever may not look at it, or for anything else", () => {
    expect(
      dependentHref(stack, "vm-1", {stacks: false, containers: true}),
    ).toBeNull();
    expect(
      dependentHref(container, "vm-1", {stacks: true, containers: false}),
    ).toBeNull();
    expect(
      dependentHref(
        {kind: "task", uuid: "t-1", recreates: false},
        "vm-1",
        everything,
      ),
    ).toBeNull();
  });
});
