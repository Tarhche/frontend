import {render, screen} from "@testing-library/react";
import {MantineProvider} from "@mantine/core";
import {Owner} from "./owner";

jest.mock("@/i18n/provider", () => {
  const t = (key: string) => key;

  return {
    useTranslations: () => t,
    useI18n: () => ({t, locale: "en", direction: "ltr"}),
  };
});

// an avatar is drawn by a module jest does not read; who is shown is the
// point, not how.
jest.mock("@/components/user-avatar", () => ({UserAvatar: () => null}));

function owner(of: Parameters<typeof Owner>[0]["of"], me?: string) {
  render(
    <MantineProvider env="test">
      <Owner of={of} me={me} />
    </MantineProvider>,
  );
}

describe("Owner", () => {
  it("shows what the code runner runs as the guest it was run for", () => {
    owner({owner_uuid: "guest", owner: {uuid: "guest"}}, "me");

    expect(screen.getByText("common.guestUser")).toBeInTheDocument();
    expect(screen.queryByText("guest")).not.toBeInTheDocument();
  });

  it("knows the guest by the uuid alone", () => {
    owner({owner_uuid: "guest"});

    expect(screen.getByText("common.guestUser")).toBeInTheDocument();
  });

  it("says one's own is one's own, and somebody unknown by their uuid", () => {
    owner({owner_uuid: "me"}, "me");
    expect(screen.getByText("workload.you")).toBeInTheDocument();

    owner({owner_uuid: "0193a1b2-c3d4-7e5f"}, "me");
    expect(screen.getByText("0193a1b2")).toBeInTheDocument();
  });
});
