type HeaderReader = {get(name: string): string | null};

// Single source of truth for recovering the original client IP from an
// incoming request's headers. Accepts anything with a Headers-like `get`
// (NextRequest.headers, next/headers ReadonlyHeaders, ...).
export function resolveClientIp(headers: HeaderReader): string | null {
  return (
    headers.get("x-forwarded-for") ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip")
  );
}
