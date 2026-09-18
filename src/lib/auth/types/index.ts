export interface AuthTokenPayload {
  aud: string[];
  exp: number;
  iat: number;
  nbf: number;
  permissions: string[];
  roles: string[];
  sub: string;
  // who opened this session to be seen as `sub`, when somebody did. Absent from
  // an ordinary session.
  impersonator?: string;
}
