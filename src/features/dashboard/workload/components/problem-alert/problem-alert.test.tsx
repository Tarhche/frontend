import {render, screen, within} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {ProblemAlert} from "./problem-alert";

jest.mock("@/i18n/provider", () => {
  const t = (key: string, vars?: Record<string, string | number>) =>
    vars ? `${key}(${Object.values(vars).join(",")})` : key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

describe("ProblemAlert", () => {
  it("says what needs what a delete was refused for, beneath why", () => {
    render(
      <MantineProvider env="test">
        <ProblemAlert
          problem={{
            status: 400,
            fields: {docker: "Docker refused the request: network in use"},
            dependents: [
              {kind: "container", uuid: "c-1", name: "web", recreates: false},
              {kind: "stack", uuid: "s-1", name: "shop", recreates: true},
            ],
            recreated: true,
            unanswered: false,
          }}
        />
      </MantineProvider>,
    );

    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByText("Docker refused the request: network in use"),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText("workload.dependents.neededBy"),
    ).toBeInTheDocument();
    expect(
      within(alert)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "workload.dependents.container.waits(workload.dependents.what.it) web",
      "workload.dependents.stack.recreates(workload.dependents.what.it) shop",
    ]);
  });

  it("says nothing of what needs it when nothing does", () => {
    render(
      <MantineProvider env="test">
        <ProblemAlert
          problem={{
            status: 404,
            code: "not_found",
            fields: {},
            unanswered: false,
          }}
        />
      </MantineProvider>,
    );

    expect(
      screen.queryByText("workload.dependents.neededBy"),
    ).not.toBeInTheDocument();
  });
});
