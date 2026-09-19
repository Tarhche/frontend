import type {NextRequest} from "next/server";

type HeaderReader = {get(name: string): string | null};

/**
 * The address the browser asked for, which is not always the one the server
 * answers on.
 *
 * `next dev --hostname 0.0.0.0` — what the container runs — reports every
 * request's url, `request.nextUrl` included, as `http://0.0.0.0:3000`, whatever
 * the Host header says. Anything built from that names an address the browser
 * never used: one that holds none of its cookies, and that is not a trustworthy
 * origin, so the ones it is handed there are refused.
 *
 * Behind Traefik the forwarded headers are what the browser asked for; without
 * them, the Host header is. Nothing says, and the answer is an empty string:
 * whoever asked can fall back to a relative url, which needs no host at all.
 */
export function browserFacingOrigin(
  headers: HeaderReader,
  secure: boolean,
): string {
  const host =
    firstValue(headers.get("x-forwarded-host")) ?? headers.get("host");

  if (!host) {
    return "";
  }

  const protocol =
    firstValue(headers.get("x-forwarded-proto")) ?? (secure ? "https" : "http");

  return new URL(`${protocol}://${host}`).origin;
}

/**
 * The same address, as a url to give a pathname to.
 *
 * A middleware redirect is the one thing that has to name a host: it cannot
 * call `redirect()` from next/navigation, and a relative Location -- legal HTTP
 * -- is refused by Next itself, which parses the header and throws
 * ERR_INVALID_URL. Everything else redirects from the page tree instead.
 */
export function browserFacingUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();

  const origin = browserFacingOrigin(
    request.headers,
    url.protocol === "https:",
  );
  if (!origin) {
    return url;
  }

  const asked = new URL(origin);

  url.protocol = asked.protocol;
  url.hostname = asked.hostname;
  // an empty port clears the one the server listens on, which the browser never
  // used and which setting the hostname alone would leave behind
  url.port = asked.port;

  return url;
}

// a forwarded header may carry every proxy it passed; the first is the browser.
function firstValue(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const value = header.split(",")[0].trim();

  return value.length > 0 ? value : null;
}
