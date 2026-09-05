import {render} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {StateBadge} from "./state-badge";

// the badge asks for its words in the reader's language; the dictionary is a
// detail of that, and what this is about is which words it asks for.
jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}(${Object.values(vars).join(",")})` : key,
}));

function badge(props: React.ComponentProps<typeof StateBadge>) {
  // wrapped, so that what is read back is the badge rather than the styles
  // mantine puts beside it.
  const {getByTestId, unmount} = render(
    <MantineProvider>
      <div data-testid="badge">
        <StateBadge {...props} />
      </div>
    </MantineProvider>,
  );

  const said = getByTestId("badge").textContent;
  unmount();

  return said;
}

describe("StateBadge", () => {
  it("says what a container is on its way to rather than where the runner keeps it", () => {
    expect(badge({state: "scheduled", expectedState: "running"})).toBe(
      "containers.transitions.starting",
    );
  });

  it("says what is being done to one that is on its way out", () => {
    expect(badge({state: "scheduled", expectedState: "stopped"})).toBe(
      "containers.transitions.stopping",
    );
  });

  it("says a restart is a restart", () => {
    expect(badge({state: "restarting", expectedState: "running"})).toBe(
      "containers.transitions.restarting",
    );
  });

  it("says what somebody has just asked for, before the runner agrees", () => {
    expect(
      badge({state: "running", expectedState: "running", pending: "stopping"}),
    ).toBe("containers.transitions.stopping");
    expect(
      badge({state: "running", expectedState: "running", pending: "killing"}),
    ).toBe("containers.transitions.killing");
    expect(
      badge({
        state: "running",
        expectedState: "running",
        pending: "restarting",
      }),
    ).toBe("containers.transitions.restarting");
  });

  it("says a delete somebody has just asked for, before it happens", () => {
    expect(
      badge({state: "running", expectedState: "running", pending: "deleting"}),
    ).toBe("containers.transitions.deleting");
  });

  it("counts the attempts of one that failed and is still wanted", () => {
    expect(
      badge({
        state: "failed",
        expectedState: "running",
        retries: 2,
        maxRetries: 3,
      }),
    ).toBe("failed - containers.table.retryingCount(2,3)");
  });

  it("says only that it is trying again when there is no limit", () => {
    expect(
      badge({
        state: "failed",
        expectedState: "running",
        retries: 7,
        maxRetries: -1,
      }),
    ).toBe("failed - containers.table.retrying");
  });

  it("says a container the runner has given up on has failed, and no more", () => {
    expect(
      badge({
        state: "failed",
        expectedState: "failed",
        retries: 3,
        maxRetries: 3,
      }),
    ).toBe("failed");
  });

  it("says where one is going before the runner has moved it", () => {
    expect(badge({state: "running", expectedState: "stopped"})).toBe(
      "containers.transitions.stopping",
    );
    expect(badge({state: "stopped", expectedState: "running"})).toBe(
      "containers.transitions.starting",
    );
  });

  it("leaves a container that is where it belongs alone", () => {
    expect(badge({state: "running", expectedState: "running"})).toBe("running");
    expect(badge({state: "stopped", expectedState: "stopped"})).toBe("stopped");
  });
});
