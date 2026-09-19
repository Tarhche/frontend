import jwt from "jsonwebtoken";

export type SessionClaims = {
  sub: string;
  impersonator?: string;
  exp?: number;
};

/**
 * A session's id: who it acts as, and who is behind it.
 *
 * Two signed-in sessions can stand for the same person — their own, and one
 * somebody else opened to be seen as them — so the subject alone does not tell
 * them apart.
 */
export function sessionId(claims: SessionClaims): string {
  return claims.impersonator
    ? `${claims.impersonator}~${claims.sub}`
    : claims.sub;
}

/** What an access token says about the session it belongs to. */
export function sessionClaims(token?: string): SessionClaims | null {
  const decoded = jwt.decode(token ?? "", {json: true}) as Record<
    string,
    unknown
  > | null;

  if (!decoded || typeof decoded.sub !== "string" || decoded.sub.length === 0) {
    return null;
  }

  return {
    sub: decoded.sub,
    impersonator:
      typeof decoded.impersonator === "string" &&
      decoded.impersonator.length > 0
        ? decoded.impersonator
        : undefined,
    exp: typeof decoded.exp === "number" ? decoded.exp : undefined,
  };
}
