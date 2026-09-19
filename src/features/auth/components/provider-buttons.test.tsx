import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {ProviderButtons} from "./provider-buttons";

// the buttons ask for their words in the reader's language; what this is about
// is which words they ask for, and with what.
jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}(${Object.values(vars).join(",")})` : key,
}));

const begin = jest.fn();

jest.mock("../actions/provider-login", () => ({
  beginProviderLogin: (provider: string) => begin(provider),
}));

function buttons(providers: string[]) {
  // wrapped, so that what is read back is the buttons rather than the styles
  // mantine puts beside them
  return render(
    <MantineProvider>
      <div data-testid="buttons">
        <ProviderButtons providers={providers} />
      </div>
    </MantineProvider>,
  );
}

describe("ProviderButtons", () => {
  beforeEach(() => {
    begin.mockReset();
  });

  it("offers each provider under the name people know it by", () => {
    buttons(["google", "github", "linkedin"]);

    expect(
      screen.getByRole("button", {name: "auth.providers.continueWith(Google)"}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {name: "auth.providers.continueWith(GitHub)"}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "auth.providers.continueWith(LinkedIn)",
      }),
    ).toBeInTheDocument();
  });

  it("shows a provider it has never heard of under its own name", () => {
    // the backend is what decides who may be signed in with; a frontend that
    // has not been taught a brand yet must not hide the way in
    buttons(["gitlab"]);

    expect(
      screen.getByRole("button", {name: "auth.providers.continueWith(gitlab)"}),
    ).toBeInTheDocument();
  });

  it("renders nothing at all when none are configured", () => {
    buttons([]);

    // not even the divider: there is nothing to divide the form from
    expect(screen.getByTestId("buttons")).toBeEmptyDOMElement();
  });

  it("starts the login the button names", async () => {
    begin.mockResolvedValue({url: ""});

    buttons(["google", "github"]);

    await userEvent.click(
      screen.getByRole("button", {name: "auth.providers.continueWith(GitHub)"}),
    );

    expect(begin).toHaveBeenCalledTimes(1);
    expect(begin).toHaveBeenCalledWith("github");
  });

  it("says so when the way in cannot be opened, rather than going nowhere", async () => {
    begin.mockResolvedValue({url: ""});

    buttons(["google"]);

    await userEvent.click(
      screen.getByRole("button", {name: "auth.providers.continueWith(Google)"}),
    );

    expect(
      await screen.findByText("auth.providers.unavailable"),
    ).toBeInTheDocument();
  });
});
