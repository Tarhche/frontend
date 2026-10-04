import {render, screen} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {RuntimeBadge} from "./runtime-badge";

// what the dictionary has words for, in the tests that need any. Otherwise the
// badge's words are the keys it asks for, which is what this is about.
let mockWords: Record<string, string> = {};

jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      mockWords[key] ??
      (vars ? `${key}(${Object.values(vars).join(",")})` : key),
}));

function badge(props: React.ComponentProps<typeof RuntimeBadge>) {
  // wrapped, so that what is read back is the badge rather than the styles
  // mantine puts beside it.
  const {unmount} = render(
    <MantineProvider>
      <div data-testid="badge">
        <RuntimeBadge {...props} />
      </div>
    </MantineProvider>,
  );

  const said = screen.getByTestId("badge").textContent;
  unmount();

  return said;
}

beforeEach(() => {
  mockWords = {};
});

describe("RuntimeBadge", () => {
  it("says what a task is run as, by the name it is asked for by", () => {
    expect(badge({runtime: "other"})).toBe("other");
    expect(badge({runtime: "sysbox"})).toBe("sysbox");
  });

  it("says no class for a task the workload named none for", () => {
    expect(badge({})).toBe("");
    expect(badge({runtime: ""})).toBe("");
    expect(badge({node: "node-2"})).toBe("node-2");
  });

  it("says a class nobody has named yet as the workload calls it", () => {
    expect(badge({runtime: "gvisor"})).toBe("gvisor");
  });

  it("says which node a task is on, beside what it is run as", () => {
    expect(badge({runtime: "other", node: "node-2"})).toBe("othernode-2");
  });

  it("says nothing of a node a task has not been given yet", () => {
    expect(badge({runtime: "sysbox", node: ""})).toBe("sysbox");
  });

  it("draws every class alike, whatever it is called", () => {
    render(
      <MantineProvider>
        <RuntimeBadge runtime="sysbox" />
        <RuntimeBadge runtime="other" />
      </MantineProvider>,
    );

    // mantine puts a badge's colour in its style.
    const look = (runtime: string) =>
      screen.getByTitle(runtime).getAttribute("style");

    expect(look("sysbox")).toBeTruthy();
    expect(look("other")).toBe(look("sysbox"));
  });

  it("says what the class is in the reader's language, when asked", () => {
    mockWords = {"tasks.runtime.classes.other": "Another runtime"};

    render(
      <MantineProvider>
        <RuntimeBadge runtime="other" node="node-2" />
      </MantineProvider>,
    );

    expect(screen.getByTitle("Another runtime")).toHaveTextContent("other");
    expect(screen.getByText("node-2")).toHaveAttribute(
      "title",
      "tasks.runtime.node",
    );
  });
});
