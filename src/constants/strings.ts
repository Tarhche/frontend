export const BRAND_NAME = "طرح‌چه";

export const ACCESS_TOKEN_COOKIE_NAME = "access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
export const LANGUAGE_COOKIE_NAME = "lang";

// What a login started with somebody else's account is recognised by when the
// browser comes back: the provider that was asked and the state it was asked
// with. It is the server's, never the page's.
export const OAUTH_HANDSHAKE_COOKIE_NAME = "oauth_handshake";

// HTTP header the backend's localize middleware reads to resolve the request
// language (header → authenticated user's language → site default).
export const LANGUAGE_CODE_HEADER = "X-Language-Code";
