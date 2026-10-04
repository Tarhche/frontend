import {
  expiryOf,
  formatDuration,
  formatRelative,
  lifetimeFrom,
  lifetimeSeconds,
} from "./lifetime";

describe("a VM's lifetime", () => {
  it("is nothing while it is kept until deleted", () => {
    expect(lifetimeSeconds({keep: true, amount: 5, unit: "days"})).toBe(0);
  });

  it("is sent in seconds", () => {
    expect(lifetimeSeconds({keep: false, amount: 6, unit: "hours"})).toBe(
      21600,
    );
    expect(lifetimeSeconds({keep: false, amount: 1.5, unit: "days"})).toBe(
      129600,
    );
  });

  it("is shown in days when it is whole days", () => {
    expect(lifetimeFrom(0).keep).toBe(true);
    expect(lifetimeFrom(2 * 86400)).toEqual({
      keep: false,
      amount: 2,
      unit: "days",
    });
    expect(lifetimeFrom(36 * 3600)).toEqual({
      keep: false,
      amount: 36,
      unit: "hours",
    });
  });

  it("has no expiry while it is kept, or when the API says the zero time", () => {
    expect(
      expiryOf({lifetime_seconds: 0, expires_at: "2026-10-05T00:00:00Z"}),
    ).toBe(null);
    expect(
      expiryOf({lifetime_seconds: 60, expires_at: "0001-01-01T00:00:00Z"}),
    ).toBe(null);
    expect(
      expiryOf({lifetime_seconds: 60, expires_at: "2026-10-05T00:00:00Z"}),
    ).toEqual(new Date("2026-10-05T00:00:00Z"));
  });

  it("is said in words", () => {
    const now = new Date("2026-10-04T10:00:00Z");

    expect(formatRelative(new Date("2026-10-04T13:00:00Z"), now)).toBe(
      "in 3 hours",
    );
    expect(formatRelative(new Date("2026-10-06T10:00:00Z"), now)).toBe(
      "in 2 days",
    );
    expect(formatDuration(45)).toBe("45 sec");
    expect(formatDuration(240)).toBe("4 min");
    expect(formatDuration(7200)).toBe("2 hr");
  });
});
