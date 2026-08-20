import {NextResponse, type NextRequest} from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";
import languageMiddleware from "@/middlewares/languageMiddleware";

export async function proxy(req: NextRequest) {
  // The container healthcheck probes /health, so it has to answer without any
  // middleware in the way: languageMiddleware would 308 it to /{lang}/health
  // (and call the backend to resolve the language), which turns a healthy
  // replica into a failing probe.
  if (req.nextUrl.pathname === "/health") {
    return NextResponse.next();
  }

  const languageRedirect = await languageMiddleware(req);
  if (languageRedirect) {
    return languageRedirect;
  }

  return authMiddleware(req);
}

export const config = {
  matcher: ["/:path*"],
};
