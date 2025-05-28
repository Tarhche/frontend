export interface AuthTokenPayload {
  aud: string[];
  exp: number;
  iat: number;
  nbf: number;
  permissions: string[];
  roles: string[];
  sub: string;
}
