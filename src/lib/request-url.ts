import type {NextRequest} from "next/server";

/**
 * The url the browser asked for, which is not always the one the server sees.
 *
 * `next dev --hostname 0.0.0.0` — what the container runs — reports every
 * request's url, `request.nextUrl` included, as `http://0.0.0.0:3000`, whatever
 * the Host header says. A redirect built from that sends the browser to an
 * address it holds no cookies for (and which is not a trustworthy origin, so
 * the ones it is handed there are refused), which looks exactly like being
 * signed out: the dashboard bounces to the login page, on 0.0.0.0, forever.
 *
 * A middleware redirect is the one place that has to name a host: it cannot
 * call `redirect()` from next/navigation, and a relative Location -- legal HTTP
 * -- is refused by Next itself, which parses the header and throws
 * ERR_INVALID_URL. Everything else redirects from the page tree instead.
 *
 * Behind Traefik the forwarded headers are what the browser asked for; without
 * them, the Host header is. Callers get a clone, to give a pathname to.
 */
export function browserFacingUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone();

  const host =
    firstValue(request.headers.get("x-forwarded-host")) ??
    request.headers.get("host");

  if (!host) {
    return url;
  }

  url.host = host;

  // setting a host without a port keeps the one that was there, which would put
  // the port the server listens on into an address the browser never used
  if (!hasPort(host)) {
    url.port = "";
  }

  const protocol = firstValue(request.headers.get("x-forwarded-proto"));
  if (protocol) {
    url.protocol = protocol;
  }

  return url;
}

function hasPort(host: string): boolean {
  return /:\d+$/.test(host);
}

// a forwarded header may carry every proxy it passed; the first is the browser.
function firstValue(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const value = header.split(",")[0].trim();

  return value.length > 0 ? value : null;
}
