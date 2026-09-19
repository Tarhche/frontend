import jwt from "jsonwebtoken";
import {sessionClaims, sessionId} from "./session";

/** tokenFor mints what the backend would, without the signature mattering. */
function tokenFor(claims: Record<string, unknown>): string {
  return jwt.sign(claims, "not-the-real-key");
}

describe("sessionClaims", () => {
  it("reads who a session acts as", () => {
    expect(sessionClaims(tokenFor({sub: "user-uuid"}))).toMatchObject({
      sub: "user-uuid",
      impersonator: undefined,
    });
  });

  it("reads who is behind a session somebody else opened", () => {
    expect(
      sessionClaims(tokenFor({sub: "user-uuid", impersonator: "admin-uuid"})),
    ).toMatchObject({sub: "user-uuid", impersonator: "admin-uuid"});
  });

  it("says nothing about a token that names nobody", () => {
    expect(sessionClaims(undefined)).toBeNull();
    expect(sessionClaims("")).toBeNull();
    expect(sessionClaims("not-a-token")).toBeNull();
    expect(sessionClaims(tokenFor({lang: "en"}))).toBeNull();
  });
});

describe("sessionId", () => {
  it("is who the session acts as", () => {
    expect(sessionId({sub: "user-uuid"})).toBe("user-uuid");
  });

  it("tells a person's own session apart from one opened to be seen as them", () => {
    const own = sessionId({sub: "user-uuid"});
    const shadow = sessionId({sub: "user-uuid", impersonator: "admin-uuid"});

    // both stand for the same person, and both can be signed in at once
    expect(shadow).not.toBe(own);
    expect(shadow).toBe("admin-uuid~user-uuid");
  });

  it("tells two impersonators of the same person apart", () => {
    expect(sessionId({sub: "user-uuid", impersonator: "admin-a"})).not.toBe(
      sessionId({sub: "user-uuid", impersonator: "admin-b"}),
    );
  });
});
