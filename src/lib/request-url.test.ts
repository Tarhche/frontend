import type {NextRequest} from "next/server";
import {browserFacingUrl} from "./request-url";

/** requestFor stands in for a request the server answers on `served`. */
function requestFor(served: string, headers: Record<string, string> = {}) {
  const nextUrl = new URL(served) as URL & {clone: () => URL};
  nextUrl.clone = () => new URL(served);

  return {nextUrl, headers: new Headers(headers)} as unknown as NextRequest;
}

describe("browserFacingUrl", () => {
  it("puts the url back on the host the browser asked for", () => {
    // what `next dev --hostname 0.0.0.0` reports every request as
    const url = browserFacingUrl(
      requestFor("http://0.0.0.0:3000/dashboard", {host: "localhost:3000"}),
    );

    expect(url.host).toBe("localhost:3000");
    expect(url.pathname).toBe("/dashboard");
  });

  it("prefers what a proxy says the browser asked for", () => {
    const url = browserFacingUrl(
      requestFor("http://0.0.0.0:3000/dashboard", {
        host: "frontend:3000",
        "x-forwarded-host": "tarhche.com",
        "x-forwarded-proto": "https",
      }),
    );

    expect(url.origin).toBe("https://tarhche.com");
  });

  it("reads the browser's own hop out of a list of them", () => {
    const url = browserFacingUrl(
      requestFor("http://0.0.0.0:3000/", {
        host: "frontend:3000",
        "x-forwarded-host": "tarhche.com, inner-proxy",
        "x-forwarded-proto": "https, http",
      }),
    );

    expect(url.origin).toBe("https://tarhche.com");
  });

  it("keeps what was asked for besides the host", () => {
    const url = browserFacingUrl(
      requestFor("http://0.0.0.0:3000/articles?page=2", {
        host: "localhost:3000",
      }),
    );

    expect(url.href).toBe("http://localhost:3000/articles?page=2");
  });

  it("leaves a url alone when nothing says who asked", () => {
    const url = browserFacingUrl(requestFor("http://0.0.0.0:3000/dashboard"));

    expect(url.href).toBe("http://0.0.0.0:3000/dashboard");
  });
});
