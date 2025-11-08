import type {NextRequest} from "next/server";
import authMiddleware from "@/middlewares/authMiddleware";

export async function proxy(req: NextRequest) {
  return authMiddleware(req);
}

export const config = {
  matcher: ["/:path*"],
};
