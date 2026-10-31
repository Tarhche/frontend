import {render, screen} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {VmStateBadge} from "./vm-state-badge";

// the badge asks for its words in the reader's language; the dictionary is a
// detail of that, and what this is about is which words it asks for.
jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}(${Object.values(vars).join(",")})` : key,
}));

function badge(props: React.ComponentProps<typeof VmStateBadge>) {
  // wrapped, so that what is read back is the badge rather than the styles
  // mantine puts beside it.
  const {unmount} = render(
    <MantineProvider>
      <div data-testid="badge">
        <VmStateBadge {...props} />
      </div>
    </MantineProvider>,
  );

  const said = screen.getByTestId("badge").textContent;
  unmount();

  return said;
}

describe("VmStateBadge", () => {
  it("says what a VM is on its way to rather than where the workload keeps it", () => {
    expect(badge({state: "scheduled", expectedState: "running"})).toBe(
      "vms.transitions.starting",
    );
  });

  it("says what is being done to one that is on its way out", () => {
    expect(badge({state: "scheduled", expectedState: "stopped"})).toBe(
      "vms.transitions.stopping",
    );
  });

  it("says what a VM is in the middle of, in the words of what is being done", () => {
    expect(badge({state: "starting", expectedState: "running"})).toBe(
      "vms.transitions.starting",
    );
    expect(badge({state: "restarting", expectedState: "running"})).toBe(
      "vms.transitions.restarting",
    );
    expect(badge({state: "restoring", expectedState: "running"})).toBe(
      "vms.transitions.restoring",
    );
    expect(badge({state: "deleting", expectedState: "running"})).toBe(
      "vms.transitions.deleting",
    );
  });

  it("says what somebody has just asked for, before the workload agrees", () => {
    expect(
      badge({state: "running", expectedState: "running", pending: "stopping"}),
    ).toBe("vms.transitions.stopping");
    expect(
      badge({state: "running", expectedState: "running", pending: "deleting"}),
    ).toBe("vms.transitions.deleting");
  });

  it("says where one is going before the workload has moved it", () => {
    expect(badge({state: "running", expectedState: "stopped"})).toBe(
      "vms.transitions.stopping",
    );
    expect(badge({state: "stopped", expectedState: "running"})).toBe(
      "vms.transitions.starting",
    );
  });

  it("leaves a VM that is where it belongs alone, in its own words when there are none", () => {
    expect(badge({state: "running", expectedState: "running"})).toBe("running");
  });

  it("says a VM that failed has failed, rather than that it is on its way back", () => {
    // nothing tries a VM again by itself, so there are no attempts to count
    // and nothing it is on its way to.
    expect(badge({state: "failed", expectedState: "running"})).toBe("failed");
    expect(badge({state: "failed", expectedState: "stopped"})).toBe("failed");
  });

  it("still says what somebody asked of a VM that failed", () => {
    expect(
      badge({state: "failed", expectedState: "running", pending: "starting"}),
    ).toBe("vms.transitions.starting");
  });
});
