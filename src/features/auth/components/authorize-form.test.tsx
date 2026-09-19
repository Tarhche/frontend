import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MantineProvider} from "@mantine/core";
import {AuthorizeForm} from "./authorize-form";

// the page asks for its words in the reader's language; what this is about is
// which question is put and what the answer does.
jest.mock("@/i18n/provider", () => ({
  useTranslations:
    () => (key: string, vars?: Record<string, string | number>) =>
      vars ? `${key}(${Object.values(vars).join(",")})` : key,
}));

const answer = jest.fn();
const left = jest.fn();

jest.mock("@/lib/navigate", () => ({
  leaveFor: (url: string) => left(url),
}));

jest.mock("../actions/answer-authorization", () => ({
  answerAuthorization: (state: unknown, formData: FormData) =>
    answer(formData.get("request"), formData.get("decision")),
}));

function consent() {
  return render(
    <MantineProvider>
      <AuthorizeForm
        request="a-signed-request"
        application={{
          name: "An agent",
          uri: "https://agent.example",
          redirectUri: "http://127.0.0.1:41293/callback",
        }}
        account={{name: "Somebody", identity: "somebody@example.com"}}
      />
    </MantineProvider>,
  );
}

describe("AuthorizeForm", () => {
  beforeEach(() => {
    answer.mockReset();
    left.mockReset();
    answer.mockResolvedValue({success: false});
  });

  it("says who is asking, as whom, and where they will be answered", () => {
    consent();

    expect(
      screen.getByText("auth.authorize.title(An agent)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("auth.authorize.answeredAt(127.0.0.1:41293)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("auth.authorize.signedInAs(Somebody)"),
    ).toBeInTheDocument();

    // what it would be able to do is said before it is allowed to
    expect(screen.getByText("auth.authorize.actsAsYou")).toBeInTheDocument();
    expect(
      screen.getByText("auth.authorize.yourPermissions"),
    ).toBeInTheDocument();
    expect(screen.getByText("auth.authorize.warning")).toBeInTheDocument();
  });

  it("carries the request back untouched, with what was decided", async () => {
    const user = userEvent.setup();
    consent();

    await user.click(
      screen.getByRole("button", {name: "auth.authorize.approve"}),
    );

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith("a-signed-request", "approve"),
    );
  });

  it("refusing is an answer too, and is sent as one", async () => {
    const user = userEvent.setup();
    consent();

    await user.click(screen.getByRole("button", {name: "auth.authorize.deny"}));

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith("a-signed-request", "deny"),
    );
  });

  it("goes where the backend says, and nowhere the page made up", async () => {
    answer.mockResolvedValue({
      success: true,
      redirectTo: "http://127.0.0.1:41293/callback?code=a-code&state=s",
    });

    const user = userEvent.setup();
    consent();

    await user.click(
      screen.getByRole("button", {name: "auth.authorize.approve"}),
    );

    await waitFor(() =>
      expect(left).toHaveBeenCalledWith(
        "http://127.0.0.1:41293/callback?code=a-code&state=s",
      ),
    );
  });

  it("an application with no name of its own still has one", () => {
    render(
      <MantineProvider>
        <AuthorizeForm
          request="a-signed-request"
          application={{redirectUri: "https://agent.example/callback"}}
          account={{}}
        />
      </MantineProvider>,
    );

    expect(
      screen.getByText(
        "auth.authorize.title(auth.authorize.unknownApplication)",
      ),
    ).toBeInTheDocument();
  });
});
