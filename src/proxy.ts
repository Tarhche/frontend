import type {NextRequest} from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";
import languageMiddleware from "@/middlewares/languageMiddleware";

export async function proxy(req: NextRequest) {
  const languageRedirect = await languageMiddleware(req);
  if (languageRedirect) {
    return languageRedirect;
  }

  return authMiddleware(req);
}

export const config = {
  matcher: ["/:path*"],
};
